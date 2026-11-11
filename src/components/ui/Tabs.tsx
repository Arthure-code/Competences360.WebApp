import styles from "./Tabs.module.css"

export interface TabItem {
    id: string
    label: string
}

interface TabsProps {
  items: readonly TabItem[] 
  active: string
  onChange: (id: string) => void
  className?: string
}

export default function Tabs({ items, active, onChange, className = "" }: TabsProps) {
    return (
        <div className={`${styles.tabs} ${className}`} role="tablist">
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active === item.id}
                    className={`${styles.tab} ${active === item.id ? styles.tabActive : ""}`}
                    onClick={() => onChange(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    )
}
