/**
 * JSONPlaceholder's todo titles are lorem ipsum ("delectus aut autem"). The app still loads its
 * tasks from the API, as the brief requires, but shows a household chore for each of the first
 * ten ids so the list reads like a real one. The API's id, completion state and userId are kept.
 */
export const CHORE_TITLES: Readonly<Record<number, string>> = {
  1: "Wash the dishes",
  2: "Take out the rubbish",
  3: "Vacuum the living room",
  4: "Water the plants",
  5: "Do a load of laundry",
  6: "Clean the bathroom",
  7: "Change the bed sheets",
  8: "Wipe down the kitchen counters",
  9: "Mop the kitchen floor",
  10: "Clean out the fridge",
};

/** The todo with its chore title, or unchanged when there is no chore for its id. */
export function withChoreTitle<T extends { id: number; title: string }>(todo: T): T {
  const chore = CHORE_TITLES[todo.id];
  return chore ? { ...todo, title: chore } : todo;
}
