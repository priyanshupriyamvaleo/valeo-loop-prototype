"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, MoveVertical, Trash2, Save } from "lucide-react"

export default function SurveyBuilderPage() {
    const params = useParams()
    const isNew = params.id === "new"

    const [questions, setQuestions] = useState([
        { id: 1, type: "text", text: "What is your primary health goal?" },
        { id: 2, type: "single_choice", text: "Do you smoke?", options: ["Yes", "No", "Occasionally"] }
    ])

    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now(), type: "text", text: "New Question" }])
    }

    const removeQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/clinical/surveys">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-lg font-semibold">{isNew ? "New Survey" : "Edit Survey"}</h2>
                        <p className="text-xs text-muted-foreground">{isNew ? "Draft" : "v1.2 - Published"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Preview</Button>
                    <Button size="sm">
                        <Save className="mr-2 h-4 w-4" /> Save Logic
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Survey Settings Sidebar */}
                <div className="w-80 shrink-0 border-r pr-6 overflow-auto space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Survey Configuration</h3>
                        <div className="space-y-2">
                            <Label>Survey Title</Label>
                            <Input defaultValue={isNew ? "" : "General Health Intake"} />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select defaultValue="medical">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="medical">Medical History</SelectItem>
                                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                                    <SelectItem value="feedback">Feedback</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>User Group Target</Label>
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="male">Male Only</SelectItem>
                                    <SelectItem value="female">Female Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Question Builder Canvas */}
                <div className="flex-1 overflow-auto bg-gray-50/50 p-6 rounded-lg border-2 border-dashed">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {questions.map((q) => (
                            <Card key={q.id} className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-4 flex gap-4">
                                    <div className="mt-2 text-muted-foreground cursor-move">
                                        <MoveVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <Input defaultValue={q.text} className="font-medium text-lg border-transparent hover:border-input focus:border-input px-0 h-auto" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Answer Type</Label>
                                                <Select defaultValue={q.type}>
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Short Text</SelectItem>
                                                        <SelectItem value="long_text">Long Text</SelectItem>
                                                        <SelectItem value="single_choice">Single Choice</SelectItem>
                                                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Required?</Label>
                                                <Select defaultValue="yes">
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">Yes</SelectItem>
                                                        <SelectItem value="no">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        {['single_choice', 'multiple_choice'].includes(q.type) && (
                                            <div className="pl-4 border-l-2 space-y-2">
                                                {q.options?.map((opt: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full border" />
                                                        <Input defaultValue={opt} className="h-7 w-64" />
                                                    </div>
                                                ))}
                                                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">+ Add Option</Button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(q.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Button variant="outline" className="w-full border-dashed py-8 text-muted-foreground hover:text-primary hover:border-primary" onClick={addQuestion}>
                            <Plus className="mr-2 h-4 w-4" /> Add Next Question
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

