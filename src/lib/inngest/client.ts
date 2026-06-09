export type InngestEvent = {
  name: string;
  data?: Record<string, unknown>;
};

export const inngest = {
  id: 'cubiqo',
  send: async (event: InngestEvent) => ({ ids: [`local-${event.name}-${Date.now()}`] }),
};
