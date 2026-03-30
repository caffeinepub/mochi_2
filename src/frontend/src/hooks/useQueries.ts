import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Category,
  type ChatMessage,
  type Post,
  type Profile,
} from "../backend";
import { useActor } from "./useActor";

export { Category };

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPostsByCategory(category: Category | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["posts", category],
    queryFn: async () => {
      if (!actor) return [];
      if (!category) return actor.getAllPosts();
      return actor.getPostsByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      title,
      content,
    }: { category: Category; title: string; content: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createPost(category, title, content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.likePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addComment(postId, content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useGetChatMessages(category: Category) {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ["chat", category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChatMessages(category);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useAddChatMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      content,
    }: { category: Category; content: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addChatMessage(category, content);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", vars.category] });
    },
  });
}

export function useAddMoodEntry() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (rating: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.addMoodEntry(rating);
    },
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nickname: string) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(nickname);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
