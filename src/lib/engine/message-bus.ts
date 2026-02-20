/**
 * MessageBus - Agent-to-agent messaging system
 *
 * Provides an in-process message bus so that any agent can send a
 * message directly to any other agent without routing through Henry (A1).
 *
 * Messages are stored in per-agent inboxes and can be read/acknowledged
 * by the receiving agent at its own pace (asynchronous delivery).
 */

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export class MessageBus {
  /** Singleton instance */
  private static instance: MessageBus;

  /** Per-agent inbox: agentId → messages[] */
  private inboxes: Map<string, AgentMessage[]> = new Map();
  private nextId = 1;

  private constructor() {}

  static getInstance(): MessageBus {
    if (!MessageBus.instance) {
      MessageBus.instance = new MessageBus();
    }
    return MessageBus.instance;
  }

  /** Send a message from one agent to another */
  send(from: string, to: string, subject: string, body: string): AgentMessage {
    const message: AgentMessage = {
      id: `msg-${this.nextId++}`,
      from,
      to,
      subject,
      body,
      timestamp: new Date(),
      read: false,
    };

    if (!this.inboxes.has(to)) {
      this.inboxes.set(to, []);
    }
    this.inboxes.get(to)!.push(message);
    return message;
  }

  /** Get all messages in an agent's inbox (optionally filter unread only) */
  getInbox(agentId: string, unreadOnly: boolean = false): AgentMessage[] {
    const inbox = this.inboxes.get(agentId) || [];
    return unreadOnly ? inbox.filter((m) => !m.read) : [...inbox];
  }

  /** Mark a specific message as read */
  markRead(agentId: string, messageId: string): boolean {
    const inbox = this.inboxes.get(agentId);
    if (!inbox) return false;
    const msg = inbox.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.read = true;
    return true;
  }

  /** Mark all messages in an agent's inbox as read */
  markAllRead(agentId: string): number {
    const inbox = this.inboxes.get(agentId);
    if (!inbox) return 0;
    let count = 0;
    for (const msg of inbox) {
      if (!msg.read) {
        msg.read = true;
        count++;
      }
    }
    return count;
  }

  /** Clear all messages from an agent's inbox */
  clearInbox(agentId: string): void {
    this.inboxes.set(agentId, []);
  }

  /** Reset the entire bus (useful for testing) */
  reset(): void {
    this.inboxes.clear();
    this.nextId = 1;
  }
}
