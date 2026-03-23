const FilterBar = ({ year, semester, onYearChange, onSemesterChange, onClear }) => {
  const hasFilter = Boolean(year || semester);

  return (
    <div className="card-soft flex flex-wrap items-center gap-2">
      <select className="input-base max-w-48" value={year} onChange={(event) => onYearChange(event.target.value)}>
        <option value="">All Years</option>
        <option value="1">1st Year</option>
        <option value="2">2nd Year</option>
        <option value="3">3rd Year</option>
        <option value="4">4th Year</option>
      </select>
      <select className="input-base max-w-48" value={semester} onChange={(event) => onSemesterChange(event.target.value)}>
        <option value="">All Semesters</option>
        <option value="1">1st Semester</option>
        <option value="2">2nd Semester</option>
      </select>
      {hasFilter && <button type="button" className="btn-secondary" onClick={onClear}>Clear filters</button>}
    </div>
  );
};

export default FilterBar;
