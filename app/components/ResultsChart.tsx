'use client';

interface ResultsChartProps {
  options: string[];
  tallies: number[];
  totalVotes: number;
}

export function ResultsChart({ options, tallies, totalVotes }: ResultsChartProps) {
  const maxVotes = Math.max(...tallies);
  
  const colors = [
    'bg-yellow-400',
    'bg-blue-400', 
    'bg-green-400',
    'bg-purple-400',
    'bg-red-400',
    'bg-pink-400',
    'bg-indigo-400',
    'bg-orange-400',
    'bg-teal-400',
    'bg-cyan-400',
  ];

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="space-y-4">
        {options.map((option, index) => {
          const votes = tallies[index] || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const barWidth = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
          const colorClass = colors[index % colors.length];
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium truncate flex-1 mr-4">
                  {option}
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-400 font-bold min-w-[3rem] text-right">
                    {votes}
                  </span>
                  <span className="text-gray-400 min-w-[2.5rem] text-right">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <div className="relative bg-gray-800 rounded-full h-8 overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-black font-semibold text-sm">
                    {votes > 0 && `${votes} votes`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{totalVotes}</div>
          <div className="text-sm text-gray-400">Total Votes</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{options.length}</div>
          <div className="text-sm text-gray-400">Options</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {tallies.length > 0 ? Math.max(...tallies) : 0}
          </div>
          <div className="text-sm text-gray-400">Highest Votes</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {totalVotes > 0 ? ((Math.max(...tallies) / totalVotes) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-400">Winner Margin</div>
        </div>
      </div>

      {/* Winner Highlight */}
      {tallies.length > 0 && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-yellow-300">🏆 Winning Option</h3>
              <p className="text-sm text-yellow-200">
                {options[tallies.indexOf(Math.max(...tallies))]}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-yellow-400">
                {Math.max(...tallies)} votes
              </div>
              <div className="text-sm text-yellow-200">
                {((Math.max(...tallies) / totalVotes) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
