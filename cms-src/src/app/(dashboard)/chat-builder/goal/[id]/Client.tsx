"use client"

import { useParams } from "next/navigation"
import { ChatEditor } from "@/components/chat/ChatEditor"

export default function GoalChatEditorPage() {
    const params = useParams()
    const id = typeof params.id === "string" ? params.id : "new"
    return <ChatEditor kind="goal" id={id} />
}

