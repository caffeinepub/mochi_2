import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PrivateMessage {
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: bigint;
}
export interface Comment {
    content: string;
    author: Principal;
    likes: bigint;
}
export interface Post {
    title: string;
    content: string;
    author: Principal;
    likes: bigint;
    category: Category;
    comments: Array<Comment>;
}
export interface ChatMessage {
    content: string;
    author: Principal;
    timestamp: bigint;
    category: Category;
}
export interface Profile {
    nickname: string;
    badges: Array<string>;
    isMentor: boolean;
    points: bigint;
}
export interface MoodEntry {
    timestamp: bigint;
    rating: bigint;
}
export enum Category {
    relationship = "relationship",
    mentalHealth = "mentalHealth",
    studies = "studies",
    career = "career"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChatMessage(category: Category, content: string): Promise<void>;
    addComment(postId: bigint, content: string): Promise<void>;
    addMoodEntry(rating: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPost(category: Category, title: string, content: string): Promise<void>;
    getAllPosts(): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessages(category: Category): Promise<Array<ChatMessage>>;
    getMoodEntries(user: Principal): Promise<Array<MoodEntry>>;
    getPostsByCategory(category: Category): Promise<Array<Post>>;
    getPrivateMessages(user1: Principal, user2: Principal): Promise<Array<PrivateMessage>>;
    getProfile(user: Principal): Promise<Profile>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    saveCallerUserProfile(nickname: string): Promise<void>;
    saveProfile(nickname: string): Promise<void>;
    sendPrivateMessage(recipient: Principal, content: string): Promise<void>;
}
