const SearchToolbar = ({ search, onSearchChange, category, onCategoryChange, categories, onSubmit }) => {
  return (
    <div className="card-soft">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search materials"
          className="input-base"
        />
        <button type="button" onClick={onSubmit} className="btn-primary">Search</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onCategoryChange(item.value)}
            className={`rounded-full border px-3 py-1 text-sm ${category === item.value ? 'border-indigo-200 bg-indigo-100 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchToolbar;
