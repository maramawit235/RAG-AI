// components/Sidebar.tsx
export default function Sidebar() {
  // Comment out or remove the hardcoded array
  // const history = ['Project_Specs.pdf', 'Q4_Report.docx', 'Research_Notes.txt']

  return (
    <nav className="p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Files
      </h3>
      <ul className="space-y-2">
        {/* Comment out or remove the map that shows placeholder files */}
        {/* {history.map((file, i) => (
          <li key={i} className="text-sm p-2 rounded hover:bg-gray-800 cursor-pointer truncate">
            📄 {file}
          </li>
        ))} */}
        
        {/* Show a message that there are no files yet */}
        <li className="text-sm p-2 text-gray-400">No files yet</li>
      </ul>
    </nav>
  )
}