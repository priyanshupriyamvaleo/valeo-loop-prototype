import { redirect } from "next/navigation"

/**
 * THE OLD ADDRESS OF THE SHARED TASK LIBRARY.
 *
 * Tasks are authored per protocol now, so there is nothing global to show.
 * This route stays only to catch a link to the old screen: without it the
 * request falls through to `[id]`, which treats any unknown id as a protocol
 * and renders an empty "Edit Protocol" shell — a dead end that looks like a
 * real screen.
 */
export default function OldTaskLibraryRoute() {
    redirect("/catalogue/protocols")
}
