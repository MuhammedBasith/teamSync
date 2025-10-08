"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is TeamSync and who is it for?",
    answer:
      "TeamSync is a multi-tenant team management platform designed for organizations that need structured workspace management. It's perfect for small businesses, startups, and growing teams looking to manage members, roles, and teams effortlessly from one central dashboard.",
  },
  {
    question: "What's included in the Free Tier?",
    answer:
      "The Free Tier includes up to 25 members and 5 teams per organization. You'll get full access to role management (Owner, Admin, Member), real-time activity logs, bulk CSV import for adding members, and custom color palette options. It's completely free, forever!",
  },
  {
    question: "How do roles work in TeamSync?",
    answer:
      "TeamSync has three roles: Organization Owner (full control, created on signup), Admins (can manage teams and members but can't change org settings), and Members (basic access to their assigned teams). Owners and Admins can view activity logs and manage team structures.",
  },
  {
    question: "Can I invite team members in bulk?",
    answer:
      "Yes! You can invite multiple members at once by uploading a CSV file with email addresses and roles. The system validates entries, skips duplicates, and sends invite emails automatically. Invalid entries are reported so you can review and fix them.",
  },
  {
    question: "How does the activity log work?",
    answer:
      "Every important action in your organization—like adding members, changing roles, or creating teams—is automatically logged with timestamps and user details. Owners and Admins can view, filter, and export these logs as CSV or JSON for audit purposes.",
  },
  {
    question: "What happens when I reach my quota limits?",
    answer:
      "When you approach your limits (25 members or 5 teams on Free Tier), you'll see clear warnings. If you reach the limit, you won't be able to add more until you upgrade. TeamSync shows your current usage in real-time so you can plan ahead.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Everything you need to know about
            <br className="hidden md:block" />
            managing teams with TeamSync.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
