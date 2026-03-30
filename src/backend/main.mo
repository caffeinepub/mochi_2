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

  module Post {
    public func compare(post1 : Post, post2 : Post) : Order.Order {
      Int.compare(post1.title.size(), post2.title.size());
    };
  };

  let profiles = Map.empty<Principal, Profile>();
  let posts = Map.empty<Nat, Post>();
  let chatMessages = Map.empty<Nat, ChatMessage>();
  let moodEntries = Map.empty<Principal, List.List<MoodEntry>>();
  let privateMessages = Map.empty<Nat, PrivateMessage>();

  var postIdCounter = 0;
  var messageIdCounter = 0;

  // Required frontend functions
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(nickname : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let profile : Profile = {
      nickname;
      points = 0;
      badges = [];
      isMentor = false;
    };
    profiles.add(caller, profile);
  };

  // Legacy function - kept for backward compatibility
  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("Profile does not exist") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getAllPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };
    posts.values().toArray().sort();
  };

  public query ({ caller }) func getPostsByCategory(category : Category) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };
    posts.values().toArray().filter(
      func(post) { post.category == category }
    );
  };

  public query ({ caller }) func getChatMessages(category : Category) : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat messages");
    };
    chatMessages.values().toArray().filter(
      func(msg) { msg.category == category }
    );
  };

  public query ({ caller }) func getMoodEntries(user : Principal) : async [MoodEntry] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own mood entries");
    };
    switch (moodEntries.get(user)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  public query ({ caller }) func getPrivateMessages(user1 : Principal, user2 : Principal) : async [PrivateMessage] {
    if (caller != user1 and caller != user2 and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own private messages");
    };
    privateMessages.values().toArray().filter(
      func(msg) {
        (msg.sender == user1 and msg.recipient == user2)
        or (msg.sender == user2 and msg.recipient == user1)
      }
    );
  };

  public shared ({ caller }) func saveProfile(nickname : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let profile : Profile = {
      nickname;
      points = 0;
      badges = [];
      isMentor = false;
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func createPost(category : Category, title : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    let post : Post = {
      author = caller;
      category;
      title;
      content;
      likes = 0;
      comments = [];
    };
    posts.add(postIdCounter, post);
    postIdCounter += 1;
    updatePoints(caller, 10);
  };

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let updatedPost : Post = {
          post with
          likes = post.likes + 1;
        };
        posts.add(postId, updatedPost);
        updatePoints(post.author, 2);
      };
    };
  };

  public shared ({ caller }) func addComment(postId : Nat, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        let comment : Comment = {
          author = caller;
          content;
          likes = 0;
        };
        let updatedComments = post.comments.concat([comment]);
        let updatedPost : Post = {
          post with
          comments = updatedComments;
        };
        posts.add(postId, updatedPost);
        if (caller != post.author) {
          updatePoints(caller, 5);
        };
      };
    };
  };

  public shared ({ caller }) func addChatMessage(category : Category, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let message : ChatMessage = {
      author = caller;
      category;
      content;
      timestamp = getTimestamp();
    };
    chatMessages.add(messageIdCounter, message);
    messageIdCounter += 1;
  };

  public shared ({ caller }) func addMoodEntry(rating : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add mood entries");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Invalid rating");
    };
    let entry : MoodEntry = {
      rating;
      timestamp = getTimestamp();
    };
    let entries = switch (moodEntries.get(caller)) {
      case (null) {
        let newList = List.empty<MoodEntry>();
        newList.add(entry);
        newList;
      };
      case (?existing) {
        existing.add(entry);
        existing;
      };
    };
    moodEntries.add(caller, entries);
  };

  public shared ({ caller }) func sendPrivateMessage(recipient : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (caller == recipient) {
      Runtime.trap("Cannot send messages to yourself");
    };
    let message : PrivateMessage = {
      sender = caller;
      recipient;
      content;
      timestamp = getTimestamp();
    };
    privateMessages.add(messageIdCounter, message);
    messageIdCounter += 1;
  };

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

        let updatedProfile = {
          profile with
          points = newPoints;
          badges = newBadges;
        };
        profiles.add(user, updatedProfile);
      };
    };
  };

  func getTimestamp() : Int {
    0;
  };
};
