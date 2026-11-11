import "server-only";

export const CURRENT_STUDENT_ID = "S001";

export function formatSlot(slot: string): string {
  const [hoursText, minutes] = slot.split(":");
  const hours = Number(hoursText);
  const hour = hours % 12 || 12;
  const period = hours >= 12 ? "pm" : "am";
  return `${hour}:${minutes} ${period}`;
}
