import { CategoryEditor } from "@/components/catalogue/CategoryEditor"

export default function SubCategoryEditorPage() {
    return <CategoryEditor kind="subcategory" />
}

/* THE EXPORT HAS NO SERVER, so the ids it can open are fixed here.
   "new" is the create screen; the rest are the seeded records. */
export function generateStaticParams() {
    return [
    { id: "new" },
    ]
}
