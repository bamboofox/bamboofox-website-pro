import { CALENDAR_FEED_URL } from "../consts.js";

const TIME_ZONE = "Asia/Taipei";

function decodeCalendarText(value = "") {
	return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseCalendarDate(value, property = "") {
	if (!value) return null;

	if (/^\d{8}$/.test(value)) {
		const year = Number(value.slice(0, 4));
		const month = Number(value.slice(4, 6)) - 1;
		const day = Number(value.slice(6, 8));
		return { date: new Date(Date.UTC(year, month, day)), allDay: true };
	}

	const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
	if (!match) return null;

	const [, year, month, day, hour, minute, second, utc] = match;
	const parts = [year, month, day, hour, minute, second].map(Number);
	const date = utc ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5])) : new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);

	return { date, allDay: property.includes("VALUE=DATE") };
}

export function parseCalendar(icalText) {
	const unfolded = icalText.replace(/\r?\n[ \t]/g, "");
	const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

	return blocks
		.map(block => {
			const properties = {};

			for (const line of block.split(/\r?\n/)) {
				const separator = line.indexOf(":");
				if (separator === -1) continue;
				const property = line.slice(0, separator);
				const name = property.split(";")[0];
				properties[name] = { property, value: line.slice(separator + 1) };
			}

			const start = parseCalendarDate(properties.DTSTART?.value, properties.DTSTART?.property);
			const end = parseCalendarDate(properties.DTEND?.value, properties.DTEND?.property);
			if (!start) return null;

			return {
				id: properties.UID?.value || `${properties.SUMMARY?.value}-${start.date.toISOString()}`,
				title: decodeCalendarText(properties.SUMMARY?.value || "BambooFox 活動"),
				description: decodeCalendarText(properties.DESCRIPTION?.value),
				location: decodeCalendarText(properties.LOCATION?.value),
				start: start.date,
				end: end?.date || start.date,
				allDay: start.allDay,
				timeZone: TIME_ZONE
			};
		})
		.filter(Boolean);
}

export async function getUpcomingEvents({ limit = 3 } = {}) {
	try {
		const response = await fetch(CALENDAR_FEED_URL, {
			headers: { "user-agent": "BambooFox website calendar reader" },
			signal: AbortSignal.timeout(7000)
		});

		if (!response.ok) throw new Error(`calendar responded with ${response.status}`);

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const events = parseCalendar(await response.text())
			.filter(event => event.end >= today)
			.sort((a, b) => a.start - b.start)
			.slice(0, limit);

		return { events, status: "ready" };
	} catch (error) {
		console.warn(`[calendar] ${error.message}`);
		return { events: [], status: "unavailable" };
	}
}
