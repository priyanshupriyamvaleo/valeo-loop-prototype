# Valeo Coach Panel — prototype

The coach panel is a prototype of the clinician screen. A coach opens an order,
reads the patient history and the blood report, and adds a supplement or a
medicine to the protocol.

This document tells you how to run it on your own computer.

---

## 1 · What you need first

| Item | Version |
|---|---|
| Node.js | 20 or later. Version 22.23.1 is tested. |
| npm | 10 or later. Version 10.9.8 is tested. |
| Git | Any recent version. |

Check what you have:

```bash
node -v && npm -v && git --version
```

If Node.js is absent, install it from [nodejs.org](https://nodejs.org). On a Mac
you can also use Homebrew: `brew install node`.

You need nothing else. There is no database, no API key and no sign-in.

---

## 2 · Get the code

```bash
git clone https://github.com/priyanshupriyamvaleo/valeo-loop-prototype.git
cd valeo-loop-prototype
```

The default branch is `main`, and `main` carries the coach panel. You do not
need to change branch.

---

## 3 · Install the packages

```bash
cd valeo-proto
npm install
```

**Install from the `valeo-proto` directory.** The repository root has no package
file. The install takes about ten seconds. It adds 19 packages, from four direct
dependencies: React, React DOM, Vite and the Vite React plugin.

---

## 4 · Start the server

```bash
npm run dev
```

Then open this address:

**<http://localhost:5180/valeo-loop-prototype/p3/>**

**Use the whole path.** The address has three parts and needs all of them:

| Part | Why it is there |
|---|---|
| `:5180` | The port is fixed. `strictPort` is set, so Vite stops rather than moving to a free port. |
| `/valeo-loop-prototype/` | The Vite base path. GitHub Pages serves the site under the repository name, and the development server uses the same base so that the two behave alike. |
| `/p3/` | The coach panel. `p1` and `p2` are the retired prototypes. |

`http://localhost:5180/p3/` returns a 404. The base path is missing from it.

To stop the server, press `Ctrl` and `C` in the terminal.

---

## 5 · What you see on the first run

The panel fills itself with example data on the first load. You do not seed
anything and you do not open a second application.

You arrive at **Past Orders**, which is the queue of orders this coach can act
on. Filter the list to **Protocol** and open one order. The order opens the
patient, and from there you reach:

- the patient history, with the log history of each daily task and the notes a
  coach wrote before;
- the blood report, with the out-of-range markers first, a band for each marker
  and the change against the previous panel;
- the add drawer, where a coach adds a supplement or a medicine, sets the type
  of task, and sets a start date and an end date.

A coach adds only supplements and medicines. A coach never adds a blood test.
The panel states this where the option would otherwise be.

---

## 6 · Where your work is kept

The prototype writes to the **browser localStorage**. It uses no database and no
server.

| Key | Written by | Read by |
|---|---|---|
| `valeo.studio.v12` | The studio and the coach panel | The patient app |
| `valeo.patient.v12` | The patient app | The studio |

Three results follow from this:

- Your work stays in one browser on one computer.
- A second browser, or a private window, starts again from the example data.
- If you clear the browser data for the site, your work is gone.

**Do not raise `SEED_VERSION` in `valeo-proto/src/shared/bus.js`.** That number
is part of the localStorage key. Raising it changes the key, and every stored
consult becomes unreachable.

To start again from the example data, open the browser console (F12, then
Console) and run:

```js
localStorage.clear(); location.reload();
```

---

## 7 · Build the static files

```bash
npm run build
```

Vite writes to `.proto-build/` at the repository root. It never writes to the
root itself, because the root holds a folder of real images that an
`emptyOutDir` would delete.

To build and place the output where GitHub Pages serves it:

```bash
./deploy.sh
```

The script builds, then copies the output to `/p1`, `/p2`, `/p3` and
`/proto-assets` at the repository root. Commit and push those folders to publish
them.

---

## 8 · What else is in this repository

The repository holds several older prototypes. **They are retired.** They stay
in the repository and their addresses still work, but they are not presented and
they are not maintained.

| Path | State |
|---|---|
| `valeo-proto/src/p3` | **The coach panel. This is the artifact.** |
| `valeo-proto/src/p1`, `src/p2` | Retired. The patient app and the studio. |
| `p1/`, `p2/`, `p3/`, `proto/` | The built output of the above. Do not edit by hand. |
| `cms/` | A built copy of the CMS protocol prototype. |
| `cms-src/` | The source copy that produces `cms/`. |
| `v1/`, `mvp/`, `admin/`, `screens/`, `valeo-app/` and similar | Retired. |

**Do not develop the CMS from this repository.** `cms-src/` is a copy, and a copy
becomes out of date. The CMS protocol prototype has its own repository and its
own setup document:

> `https://github.com/FeelValeo/valeo-catalogue-prototype`, branch
> `feat/protocols`. Read the README there.

---

## 9 · If something fails

| What you see | Why | What to do |
|---|---|---|
| A 404 page | The base path is missing from the address. | Use `http://localhost:5180/valeo-loop-prototype/p3/`. |
| `Port 5180 is already in use` | Another program holds the port, or a server is already running. | Stop the other server. The port is fixed on purpose. |
| `vite: command not found` | You ran the command from the repository root. | `cd valeo-proto`, then `npm install`. |
| A blank page, and the console names a module | The install is incomplete. | Delete `node_modules`, then `npm install` again. |
| Old data after a code change | The data is in localStorage, not in the code. | `localStorage.clear()` in the console, then reload. |
