import { redirect } from "next/navigation";

/** Analytics is now the Insights view of the shop dashboard. */
export default function Route() {
  redirect("/studio?view=insights");
}
