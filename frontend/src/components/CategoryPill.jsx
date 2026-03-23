import { CATEGORY_STYLES } from '../constants/categories';
import { cn } from '../utils/cn';

const CategoryPill = ({ value, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(value)}
      className={cn(
        'btn-lift rounded-full border px-4 py-2 text-sm font-medium capitalize transition',
        selected ? 'ring-2 ring-indigo-300' : '',
        CATEGORY_STYLES[value] || CATEGORY_STYLES.other
      )}
    >
      {value}
    </button>
  );
};

export default CategoryPill;
