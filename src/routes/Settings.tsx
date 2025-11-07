import { useGame } from '@/lib/store'
import { DEFAULT_CATEGORIES, Category } from '@/lib/questions'

export default function Settings() {
  const { categories, setCategories } = useGame()

  function toggle(c: Category) {
    if (categories.includes(c)) setCategories(categories.filter((x) => x !== c))
    else setCategories([...categories, c])
  }

  return (
    <div className="container">
      <h1>Settings</h1>
      <div className="card">
        <div className="label">Categories</div>
        <div className="row" style={{ marginTop: 8 }}>
          {DEFAULT_CATEGORIES.map((c) => (
            <label key={c} style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input type="checkbox" checked={categories.includes(c)} onChange={() => toggle(c)} />
              {c}
            </label>
          ))}
        </div>
        <p style={{ opacity:.8, marginTop:12 }}>Questions are randomly chosen from the enabled categories.</p>
      </div>
    </div>
  )
}
