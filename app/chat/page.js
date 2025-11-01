'use client';
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { apiRequest } from "@/lib/api";
import UserList from "./components/UserList";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function ChatPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [insight, setInsight] = useState(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [insightsCache, setInsightsCache] = useState({});
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  const openRoster = useCallback(() => setIsRosterOpen(true), []);
  const closeRoster = useCallback(() => setIsRosterOpen(false), []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.replace("/login");
      return;
    }

    setToken(storedToken);
    try {
      setCurrentUser(JSON.parse(storedUser));
    } catch {
      handleUnauthorized();
    }
  }, [handleUnauthorized, router]);

  useEffect(() => {
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setIsLoadingUsers(true);
    setUsersError("");

    apiRequest("/users", "GET", null, token)
      .then((data) => {
        if (!isMounted) return;

        if (!data?.ok) {
          if (data?.status === 401) {
            handleUnauthorized();
            return;
          }
          setUsers([]);
          setUsersError(
            data?.error || "We couldn't load your teammates right now."
          );
          return;
        }

        const list = Array.isArray(data.users) ? data.users : [];
        const filtered =
          currentUser?.id != null
            ? list.filter((user) => user.id !== currentUser.id)
            : list;

        setUsers(filtered);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, currentUser?.id, handleUnauthorized]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleIncomingMessage = (incomingMessage) => {
      const isForMe =
        incomingMessage.sender_id === currentUser.id ||
        incomingMessage.receiver_id === currentUser.id;

      if (!isForMe) return;

      setMessages((prev) => {
        if (
          activeUser &&
          (incomingMessage.sender_id === activeUser.id ||
            incomingMessage.receiver_id === activeUser.id)
        ) {
          return [...prev, incomingMessage];
        }
        return prev;
      });
    };

    socket.on("receive-message", handleIncomingMessage);
    return () => {
      socket.off("receive-message", handleIncomingMessage);
    };
  }, [socket, currentUser, activeUser]);

  const fetchConversation = useCallback(
    async (withUserId) => {
      if (!token) return;

      setIsLoadingMessages(true);
      setChatError("");

      const cachedInsight = insightsCache[withUserId];
      const hasCachedInsight = !!cachedInsight;

      if (hasCachedInsight) {
        setInsight(cachedInsight);
        setInsightError("");
        setIsLoadingInsight(false);
      } else {
        setInsight(null);
        setInsightError("");
        setIsLoadingInsight(false);
      }

      try {
        const data = await apiRequest(
          "/messages/chathistory",
          "POST",
          { withUserId },
          token
        );

        if (!data?.ok) {
          if (data?.status === 401) {
            handleUnauthorized();
            return;
          }
          setChatError(
            data?.error ||
              "We couldn't load this conversation. Please try again."
          );
          setMessages([]);
          return;
        }

        const nextMessages = Array.isArray(data.messages)
          ? data.messages
          : [];

        setMessages(nextMessages);

        if (nextMessages.length > 0 && !hasCachedInsight) {
          setIsLoadingInsight(true);
          const insightResult = await apiRequest(
            "/insights/generate",
            "POST",
            { withUserId },
            token
          );

          if (!insightResult?.ok) {
            if (insightResult?.status === 401) {
              handleUnauthorized();
              return;
            }
            setInsight(null);
            setInsightError(
              insightResult?.error ||
                "We couldn't build an insight for this chat."
            );
          } else {
            const computedInsight = {
              summary: insightResult.summary || "",
              sentiment: insightResult.sentiment || "",
            };
            setInsight(computedInsight);
            setInsightsCache((prev) => ({
              ...prev,
              [withUserId]: computedInsight,
            }));
          }
        }
      } catch {
        setChatError(
          "We couldn't load this conversation. Please check your connection."
        );
        setMessages([]);
        if (!hasCachedInsight) {
          setInsight(null);
          setInsightError("");
        }
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingInsight(false);
      }
    },
    [handleUnauthorized, insightsCache, token]
  );

  const handleSelectUser = useCallback(
    (user) => {
      setActiveUser(user);
      setMessages([]);
      setMessageBody("");
      setChatError("");
      setMessageError("");
      const cachedInsight = insightsCache[user.id];
      if (cachedInsight) {
        setInsight(cachedInsight);
        setInsightError("");
      } else {
        setInsight(null);
        setInsightError("");
      }
      fetchConversation(user.id);
      closeRoster();
    },
    [closeRoster, fetchConversation, insightsCache]
  );

  const handleSendMessage = useCallback(async () => {
    if (!messageBody.trim() || !activeUser || !token) return;

    setIsSending(true);
    setMessageError("");

    try {
      const data = await apiRequest(
        "/messages/sendmsg",
        "POST",
        { receiver_id: activeUser.id, text: messageBody.trim() },
        token
      );

      if (!data?.ok || !data.message) {
        if (data?.status === 401) {
          handleUnauthorized();
          return;
        }
        setMessageError(
          data?.error ||
            "We couldn't send that message. Please try again in a moment."
        );
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      setMessageBody("");
      socket?.emit?.("send-message", data.message);
    } catch {
      setMessageError(
        "We couldn't send that message. Please check your connection."
      );
    } finally {
      setIsSending(false);
    }
  }, [activeUser, handleUnauthorized, messageBody, socket, token]);

  return (
    <section className="relative">
      <div className="pointer-events-none absolute -top-24 left-6 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_top,var(--brand-accent),rgba(255,255,255,0))] opacity-60" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_bottom,var(--brand-secondary),rgba(255,255,255,0))] opacity-50" />

      <div className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_50px_140px_-60px_rgba(17,28,68,0.6)] backdrop-blur-xl sm:rounded-[32px] lg:h-[min(78vh,760px)] lg:flex-row">
        <div className="hidden h-full w-full shrink-0 border-b border-white/60 bg-[rgba(242,246,255,0.9)] lg:flex lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:bg-[rgba(241,245,255,0.92)]">
          <UserList
            users={users}
            activeUserId={activeUser?.id}
            onSelectUser={handleSelectUser}
            isLoading={isLoadingUsers}
            errorMessage={usersError}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[rgba(255,255,255,0.92)]">
          <ChatWindow
            activeUser={activeUser}
            messages={messages}
            currentUserId={currentUser?.id}
            isLoading={isLoadingMessages}
            chatError={chatError}
            insight={insight}
            insightError={insightError}
            isInsightLoading={isLoadingInsight}
            onOpenRoster={openRoster}
          />

          {activeUser ? (
            <>
              {messageError && (
                <p className="border-t border-transparent px-6 pb-2 pt-3 text-sm text-[rgba(200,40,40,0.8)]">
                  {messageError}
                </p>
              )}
              <MessageInput
                value={messageBody}
                onChange={setMessageBody}
                onSubmit={handleSendMessage}
                disabled={isSending}
                isSending={isSending}
              />
            </>
          ) : (
            <div className="border-t border-white/60 bg-white/80 px-6 py-4 text-sm text-[rgba(17,28,68,0.6)]">
              Select someone from the list to start chatting.
            </div>
          )}
        </div>
      </div>

      {isRosterOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-end lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(12,18,36,0.45)] backdrop-blur-sm"
            onClick={closeRoster}
          />
          <div className="relative h-full w-full max-w-sm bg-white/98 shadow-[0_50px_140px_-60px_rgba(17,28,68,0.65)]">
            <UserList
              users={users}
              activeUserId={activeUser?.id}
              onSelectUser={handleSelectUser}
              isLoading={isLoadingUsers}
              errorMessage={usersError}
              onClose={closeRoster}
              className="bg-transparent"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
