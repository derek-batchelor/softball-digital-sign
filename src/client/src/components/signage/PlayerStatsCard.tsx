import { Player } from '@shared/types';
import { config } from '../../config';

interface PlayerStatsCardProps {
  player: Player | null | undefined;
  photoPath?: string;
  isWeekendWarrior?: boolean;
}

export const PlayerStatsCard = ({ player, photoPath, isWeekendWarrior }: PlayerStatsCardProps) => {
  if (!player) return null;

  const formatDateRange = () => {
    if (!player.statsStartDate && !player.statsEndDate) return null;

    const formatDate = (date: Date | undefined) => {
      if (!date) return '';
      // Parse ISO date string directly to avoid timezone conversion issues
      const dateStr = date instanceof Date ? date.toISOString() : String(date);
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return `${Number.parseInt(month)}/${Number.parseInt(day)}/${year.slice(-2)}`;
    };

    const start = formatDate(player.statsStartDate);
    const end = formatDate(player.statsEndDate);

    if (start && end) {
      // If same date, show once
      if (start === end) return start;
      // If different, show range
      const startParts = start.split('/');
      const endParts = end.split('/');
      // If same month/year, show M/D-D/YY format
      if (startParts[0] === endParts[0] && startParts[2] === endParts[2]) {
        return `${startParts[0]}/${startParts[1]}-${endParts[1]}/${endParts[2]}`;
      }
      return `${start} - ${end}`;
    }
    return start || end;
  };

  const dateRange = formatDateRange();

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-2 sm:p-3 md:p-3 lg:p-4 xl:p-8">
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 xl:p-10 max-w-7xl w-full ${isWeekendWarrior ? 'mb-16 sm:mb-20 md:mb-20 lg:mb-24 xl:mb-40' : ''}`}
      >
        <div className="text-center mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800">
            Player Stats
            {dateRange && ` (${dateRange})`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(180px,1fr)_2fr] lg:grid-cols-[minmax(200px,1fr)_2fr] xl:grid-cols-[minmax(250px,1fr)_2fr] gap-3 sm:gap-4 md:gap-4 lg:gap-6 xl:gap-8">
          {/* Player Photo and Info */}
          <div className="flex flex-col items-center justify-start">
            {(photoPath || player?.photoPath) && (
              <img
                key={`player-photo-${player.id}`}
                src={`${config.apiUrl}${photoPath || player?.photoPath}`}
                alt={`${player?.firstName} ${player?.lastName}`}
                className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-56 lg:h-56 xl:w-72 xl:h-72 rounded-2xl sm:rounded-3xl object-cover shadow-xl mb-2 sm:mb-2 md:mb-3 lg:mb-4"
              />
            )}
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-0.5 sm:mb-1 text-center">
              {player?.firstName} {player?.lastName}
            </h1>
            {player?.teamName && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-0.5 sm:mb-1 text-center">
                {player.teamName}
              </p>
            )}
            {player?.graduationYear && (
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 text-center">
                Class of {player.graduationYear}
              </p>
            )}
          </div>

          {/* Stats Grid - Responsive columns */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1.5 sm:gap-2 md:gap-3">
            <StatItem label="GP" value={player.gamesPlayed} />
            <StatItem label="PA" value={player.plateAppearances} />
            <StatItem label="AB" value={player.atBats} />
            <StatItem label="AVG" value={player.battingAverage?.toFixed(3) || '.000'} highlight />
            <StatItem label="OBP" value={player.onBasePercentage?.toFixed(3) || '.000'} highlight />
            <StatItem
              label="OPS"
              value={player.onBasePlusSlugging?.toFixed(3) || '.000'}
              highlight
            />
            <StatItem
              label="SLG"
              value={player.sluggingPercentage?.toFixed(3) || '.000'}
              highlight
            />
            <StatItem label="H" value={player.hits} />
            <StatItem
              label="1B"
              value={player.hits - player.doubles - player.triples - player.homeRuns || 0}
            />
            <StatItem label="2B" value={player.doubles} />
            <StatItem label="3B" value={player.triples} />
            <StatItem label="HR" value={player.homeRuns} />
            <StatItem label="RBI" value={player.rbis} />
            <StatItem label="R" value={player.runs} />
            <StatItem label="BB" value={player.walks} />
            <StatItem label="SO" value={player.strikeouts} />
            <StatItem label="K-L" value={player.strikeoutsLooking} />
            <StatItem label="HBP" value={player.hitByPitch} />
            <StatItem label="SAC" value={player.sacrificeHits} />
            <StatItem label="SF" value={player.sacrificeFlies} />
            <StatItem label="ROE" value={player.reachedOnError} />
            <StatItem label="FC" value={player.fieldersChoice} />
            <StatItem label="SB" value={player.stolenBases} />
            <StatItem
              label="SB%"
              value={player.stolenBasePercentage ? player.stolenBasePercentage.toFixed(0) : '0'}
            />
          </div>
        </div>
      </div>
      {isWeekendWarrior && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-6 lg:bottom-8 xl:bottom-16 left-0 right-0 flex justify-center px-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-base sm:text-lg md:text-xl lg:text-2xl xl:text-4xl py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16 rounded-full shadow-2xl">
            WEEKEND WARRIOR
          </div>
        </div>
      )}
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

const StatItem = ({ label, value, highlight }: StatItemProps) => (
  <div
    className={`text-center py-1 px-0.5 sm:py-1.5 sm:px-1 md:py-1.5 md:px-1.5 lg:py-2.5 lg:px-2 xl:py-3 xl:px-2 rounded-md sm:rounded-lg ${highlight ? 'bg-blue-100' : 'bg-gray-50'} flex flex-col justify-center min-h-0`}
  >
    <div className="text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base font-semibold text-gray-600 truncate leading-tight">
      {label}
    </div>
    <div
      className={`text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-gray-900'} truncate leading-tight mt-0.5`}
    >
      {value}
    </div>
  </div>
);
