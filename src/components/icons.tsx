import { Cog, Save, Trash2, type LucideProps } from "lucide-react"

export const Icons = {
  logo: (props: LucideProps) => <Cog {...props} />,
  save: (props: LucideProps) => <Save {...props} />,
  trash: (props: LucideProps) => <Trash2 {...props} />,
}
