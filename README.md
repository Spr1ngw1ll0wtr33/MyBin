# MyBin

A small phone app that shows which bin goes out on the next Wednesday, what goes in it,
and what to do with the food caddy (put it out, keep it in, or tip it into the black bin).

Address once published: **https://spr1ngw1ll0wtr33.github.io/MyBin/**

## The pattern
A 6-week loop starting Wednesday 07/10/2026:

| Week | Wheelie bin | Food caddy |
|---|---|---|
| 1 | Green | Not collected – keep food in the caddy |
| 2 | Black | Collected |
| 3 | Blue | Not collected – keep food in the caddy |
| 4 | Green | Collected |
| 5 | Black | Not collected – tip the food into the black bin |
| 6 | Blue | Collected |

On a Wednesday the app shows that day's collection until 12:00 pm, then the following week's.
Bank holiday changes are not included. If the council changes the pattern, the start date and
pattern are at the top of `app.js`.

## Publishing (one time only)
1. On github.com, open the **MyBin** repository.
2. Click **Settings** (top row), then **Pages** (left-hand list).
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Under **Branch**, choose the branch holding the app, then **/ (root)**, then **Save**.
5. Wait a couple of minutes, then open the address above.

## Installing on the phone
1. Open the address above in **Chrome**.
2. Tap **⋮** (top right) and choose **Install** (not "Create shortcut").
3. MyBin then appears with your other apps.

## Calendar reminders
Tap **Add reminders to my calendar**. A file called `mybin-reminders.ics` downloads. Tap it
(or find it in **My Files → Downloads**) and choose your calendar app. It adds a reminder every
Tuesday at 1:00 pm for the next 12 months. Repeat once a year.

## Checking the sums
`node tests/cycle.test.js` checks the pattern against the known dates.
