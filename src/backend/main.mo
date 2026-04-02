import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Profile type kept identical to previous version to preserve stable variable compatibility
  type Profile = {
    nickname : Text;
    points : Nat;
    badges : [Text];
    isMentor : Bool;
  };

  type Post = {
    author : Principal;
    category : Category;
    title : Text;
    content : Text;
    likes : Nat;
    comments : [Comment];
  };

  type Comment = {
    author : Principal;
    content : Text;
    likes : Nat;
  };

  type Category = {
    #relationship;
    #studies;
    #career;
    #mentalHealth;
  };

  type ChatMessage = {
    author : Principal;
    category : Category;
    content : Text;
    timestamp : Int;
  };

  type MoodEntry = {
    rating : Nat;
    timestamp : Int;
  };

  type PrivateMessage = {
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
  };

  type FriendRequestStatus = {
    #pending;
    #accepted;
    #rejected;
  };

  type FriendRequest = {
    from : Principal;
    to : Principal;
    status : FriendRequestStatus;
    timestamp : Int;
  };

  // Extended profile info returned to frontend (includes username)
  type UserInfo = {
    principal : Principal;
    profile : Profile;
    username : Text;
  };

  module Post {
    public func compare(post1 : Post, post2 : Post) : Order.Order {
      Int.compare(post1.title.size(), post2.title.size());
    };
  };

  // Existing stable variables — types unchanged
  let profiles = Map.empty<Principal, Profile>();
  let posts = Map.empty<Nat, Post>();
  let chatMessages = Map.empty<Nat, ChatMessage>();
  let moodEntries = Map.empty<Principal, List.List<MoodEntry>>();
  let privateMessages = Map.empty<Nat, PrivateMessage>();

  // New stable variables for social features
  let usernames = Map.empty<Principal, Text>();       // principal -> username
  let usernameIndex = Map.empty<Text, Principal>();   // username -> principal
  let friendRequests = Map.empty<Nat, FriendRequest>();
  let lastSeen = Map.empty<Principal, Int>();

  var postIdCounter = 0;
  var messageIdCounter = 0;
  var friendRequestCounter = 0;

  // ========== PROFILE FUNCTIONS ==========

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    // Remove old username from index if changing
    switch (usernames.get(caller)) {
      case (?oldUsername) {
        if (oldUsername != username) {
          usernameIndex.remove(oldUsername);
        };
      };
      case (null) {};
    };
    // Check uniqueness
    switch (usernameIndex.get(username)) {
      case (?taken) {
        if (taken != caller) {
          Runtime.trap("Username already taken");
        };
      };
      case (null) {};
    };
    usernameIndex.add(username, caller);
    usernames.add(caller, username);
    // Upsert profile keeping existing points/badges
    switch (profiles.get(caller)) {
      case (?existing) {
        let updated : Profile = { existing with nickname = username };
        profiles.add(caller, updated);
      };
      case (null) {
        let profile : Profile = {
          nickname = username;
          points = 0;
          badges = [];
          isMentor = false;
        };
        profiles.add(caller, profile);
      };
    };
  };

  public shared ({ caller }) func saveProfile(username : Text) : async () {
    await saveCallerUserProfile(username);
  };

  // Legacy
  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("Profile does not exist") };
      case (?profile) { profile };
    };
  };

  // ========== USERNAME / SEARCH ==========

  public query ({ caller }) func getCallerUsername() : async ?Text {
    usernames.get(caller);
  };

  public query ({ caller }) func searchUserByUsername(username : Text) : async ?UserInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (usernameIndex.get(username)) {
      case (null) { null };
      case (?principal) {
        switch (profiles.get(principal)) {
          case (null) { null };
          case (?profile) {
            ?{ principal; profile; username };
          };
        };
      };
    };
  };

  // ========== FRIEND REQUESTS ==========

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (caller == to) { Runtime.trap("Cannot send request to yourself") };
    let existing = friendRequests.values().toArray().filter(
      func(req : FriendRequest) : Bool {
        (req.from == caller and req.to == to) or
        (req.from == to and req.to == caller)
      }
    );
    if (existing.size() > 0) { Runtime.trap("Request already exists") };
    friendRequests.add(friendRequestCounter, {
      from = caller; to; status = #pending; timestamp = 0;
    });
    friendRequestCounter += 1;
  };

  public shared ({ caller }) func acceptFriendRequest(from : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    var found = false;
    for ((id, req) in friendRequests.entries()) {
      if (req.from == from and req.to == caller and req.status == #pending) {
        friendRequests.add(id, { req with status = #accepted });
        found := true;
      };
    };
    if (not found) { Runtime.trap("Friend request not found") };
  };

  public shared ({ caller }) func rejectFriendRequest(from : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    for ((id, req) in friendRequests.entries()) {
      if (req.from == from and req.to == caller and req.status == #pending) {
        friendRequests.add(id, { req with status = #rejected });
      };
    };
  };

  public query ({ caller }) func getIncomingFriendRequests() : async [UserInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let pending = friendRequests.values().toArray().filter(
      func(req : FriendRequest) : Bool { req.to == caller and req.status == #pending }
    );
    let result = List.empty<UserInfo>();
    for (req in pending.values()) {
      switch (profiles.get(req.from)) {
        case (?profile) {
          let uname = switch (usernames.get(req.from)) { case (?u) u; case (null) "" };
          result.add({ principal = req.from; profile; username = uname });
        };
        case (null) {};
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getOutgoingFriendRequests() : async [UserInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let pending = friendRequests.values().toArray().filter(
      func(req : FriendRequest) : Bool { req.from == caller and req.status == #pending }
    );
    let result = List.empty<UserInfo>();
    for (req in pending.values()) {
      switch (profiles.get(req.to)) {
        case (?profile) {
          let uname = switch (usernames.get(req.to)) { case (?u) u; case (null) "" };
          result.add({ principal = req.to; profile; username = uname });
        };
        case (null) {};
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getFriends() : async [UserInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let accepted = friendRequests.values().toArray().filter(
      func(req : FriendRequest) : Bool {
        req.status == #accepted and (req.from == caller or req.to == caller)
      }
    );
    let result = List.empty<UserInfo>();
    for (req in accepted.values()) {
      let friendPrincipal = if (req.from == caller) { req.to } else { req.from };
      switch (profiles.get(friendPrincipal)) {
        case (?profile) {
          let uname = switch (usernames.get(friendPrincipal)) { case (?u) u; case (null) "" };
          result.add({ principal = friendPrincipal; profile; username = uname });
        };
        case (null) {};
      };
    };
    result.toArray();
  };

  public query func areFriends(user1 : Principal, user2 : Principal) : async Bool {
    friendRequests.values().toArray().filter(
      func(req : FriendRequest) : Bool {
        req.status == #accepted and
        ((req.from == user1 and req.to == user2) or
         (req.from == user2 and req.to == user1))
      }
    ).size() > 0;
  };

  // ========== ONLINE STATUS ==========

  public shared ({ caller }) func updateLastSeen() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    lastSeen.add(caller, 0);
  };

  public query func getUserLastSeen(user : Principal) : async ?Int {
    lastSeen.get(user);
  };

  // ========== PRIVATE MESSAGES ==========

  public query ({ caller }) func getPrivateMessages(user1 : Principal, user2 : Principal) : async [PrivateMessage] {
    if (caller != user1 and caller != user2 and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    privateMessages.values().toArray().filter(
      func(msg : PrivateMessage) : Bool {
        (msg.sender == user1 and msg.recipient == user2)
        or (msg.sender == user2 and msg.recipient == user1)
      }
    );
  };

  public shared ({ caller }) func sendPrivateMessage(recipient : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (caller == recipient) { Runtime.trap("Cannot send messages to yourself") };
    privateMessages.add(messageIdCounter, {
      sender = caller; recipient; content; timestamp = 0;
    });
    messageIdCounter += 1;
  };

  // ========== POSTS ==========

  public query ({ caller }) func getAllPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    posts.values().toArray().sort();
  };

  public query ({ caller }) func getPostsByCategory(category : Category) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    posts.values().toArray().filter(func(post : Post) : Bool { post.category == category });
  };

  public shared ({ caller }) func createPost(category : Category, title : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    posts.add(postIdCounter, { author = caller; category; title; content; likes = 0; comments = [] });
    postIdCounter += 1;
    updatePoints(caller, 10);
  };

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        posts.add(postId, { post with likes = post.likes + 1 });
        updatePoints(post.author, 2);
      };
    };
  };

  public shared ({ caller }) func addComment(postId : Nat, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let comment : Comment = { author = caller; content; likes = 0 };
        posts.add(postId, { post with comments = post.comments.concat([comment]) });
        if (caller != post.author) { updatePoints(caller, 5) };
      };
    };
  };

  // ========== CHAT MESSAGES (group) ==========

  public query ({ caller }) func getChatMessages(category : Category) : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    chatMessages.values().toArray().filter(func(msg : ChatMessage) : Bool { msg.category == category });
  };

  public shared ({ caller }) func addChatMessage(category : Category, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    chatMessages.add(messageIdCounter, { author = caller; category; content; timestamp = 0 });
    messageIdCounter += 1;
  };

  // ========== MOOD ==========

  public query ({ caller }) func getMoodEntries(user : Principal) : async [MoodEntry] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (moodEntries.get(user)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  public shared ({ caller }) func addMoodEntry(rating : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (rating < 1 or rating > 5) { Runtime.trap("Invalid rating") };
    let entry : MoodEntry = { rating; timestamp = 0 };
    let entries = switch (moodEntries.get(caller)) {
      case (null) {
        let newList = List.empty<MoodEntry>();
        newList.add(entry);
        newList;
      };
      case (?existing) { existing.add(entry); existing };
    };
    moodEntries.add(caller, entries);
  };

  // ========== HELPERS ==========

  func updatePoints(user : Principal, points : Nat) {
    switch (profiles.get(user)) {
      case (null) { () };
      case (?profile) {
        let newPoints = profile.points + points;
        let badgesList = List.fromArray(profile.badges);
        let newBadges = if (newPoints >= 1000 and not badgesList.contains("Super Helper")) {
          profile.badges.concat(["Super Helper"]);
        } else if (newPoints >= 500 and not badgesList.contains("Supportive")) {
          profile.badges.concat(["Supportive"]);
        } else if (newPoints >= 100 and not badgesList.contains("Active User")) {
          profile.badges.concat(["Active User"]);
        } else { profile.badges };
        profiles.add(user, { profile with points = newPoints; badges = newBadges });
      };
    };
  };
};
