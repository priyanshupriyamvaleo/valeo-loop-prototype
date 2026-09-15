import { CategoryEditor } from "@/components/catalogue/CategoryEditor"

export default function CategoryEditorPage() {
    return <CategoryEditor kind="category" />
}

export function generateStaticParams() { return [{ id: "new" }] }
