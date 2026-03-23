const ProgressBar = ({ value = 0 }) => {
  return (
    <progress
      className="progress-native progress-shimmer h-2 w-full overflow-hidden rounded-full"
      value={Math.max(0, Math.min(100, value))}
      max="100"
    />
  );
};

export default ProgressBar;
