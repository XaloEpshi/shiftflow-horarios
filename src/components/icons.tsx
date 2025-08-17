import { Cog, Save, Trash2, type LucideProps } from "lucide-react"

export const Icons = {
  logo: (props: LucideProps) => <Cog {...props} />,
  save: (props: LucideProps) => <Save {...props} />,
  trash: (props: LucideProps) => <Trash2 {...props} />,
  spinner: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  google: (props: LucideProps) => (
     <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.84-4.84 1.84-5.84 0-10.62-4.78-10.62-10.62s4.78-10.62 10.62-10.62c3.32 0 5.62 1.34 6.92 2.62l2.5-2.5C20.44 1.18 17.08 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.2 0 12.04-4.18 12.04-12.26 0-.8-.08-1.54-.2-2.34h-11.8Z" />
    </svg>
  ),
}
