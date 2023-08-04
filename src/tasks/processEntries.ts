import { Kmail } from "libram";

const parseRankings = (text: string): string[] => {};

export const processEntries = () => {
  const messages = Kmail.inbox(500);

  messages.forEach((message) => {
    message;
  });
};
