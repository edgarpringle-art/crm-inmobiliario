// Birthday helpers: date math in Panamá time + generic greeting email from PanamaInmo.

const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Today's month/day in Panamá (UTC-5). */
export function panamaToday(): { y: number; m: number; d: number } {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" }); // YYYY-MM-DD
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

/** Days until the next birthday (0 = today). Null if the date is invalid. */
export function daysUntilBirthday(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const [, bm, bd] = birthDate.slice(0, 10).split("-").map(Number);
  if (!bm || !bd) return null;
  const t = panamaToday();
  const today = Date.UTC(t.y, t.m - 1, t.d);
  // Feb 29 birthdays fall on Feb 28 in non-leap years
  const dayFor = (y: number) => (bm === 2 && bd === 29 && new Date(Date.UTC(y, 1, 29)).getUTCMonth() !== 1 ? 28 : bd);
  let next = Date.UTC(t.y, bm - 1, dayFor(t.y));
  if (next < today) next = Date.UTC(t.y + 1, bm - 1, dayFor(t.y + 1));
  return Math.round((next - today) / 86400000);
}

/** "15 de marzo" */
export function formatBirthday(birthDate: string | null | undefined): string {
  if (!birthDate) return "";
  const [, m, d] = birthDate.slice(0, 10).split("-").map(Number);
  return m && d ? `${d} de ${MONTHS_ES[m - 1]}` : "";
}

export function birthdayEmail(firstName: string): { subject: string; body: string } {
  const name = (firstName || "").trim();
  return {
    subject: `¡Feliz cumpleaños${name ? `, ${name}` : ""}! 🎉`,
    body:
`Hola${name ? ` ${name}` : ""},

Todo el equipo de PanamaInmo te desea un muy feliz cumpleaños. 🎂

Gracias por la confianza que nos has brindado. Esperamos que este nuevo año de vida venga lleno de salud, alegría y muchos proyectos cumplidos, y que podamos seguir acompañándote en cada paso, ya sea para encontrar tu próximo hogar o una gran inversión.

¡Disfruta mucho tu día!

Con cariño,
El equipo de PanamaInmo
www.panamainmo.com`,
  };
}

/** mailto: link with the greeting prefilled (the user reviews and sends it). */
export function birthdayMailto(email: string | null | undefined, firstName: string): string {
  const { subject, body } = birthdayEmail(firstName);
  return `mailto:${email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
