import { Player } from '@shared/types';

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
    <div className="w-full h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-7xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Player Stats
            {dateRange && ` (${dateRange})`}
          </h2>
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-8">
          {/* Player Photo and Info */}
          <div className="flex flex-col items-center justify-start">
            {(photoPath || player?.photoPath) && (
              <img
                key={`player-photo-${player.id}`}
                src={photoPath || player?.photoPath}
                alt={`${player?.firstName} ${player?.lastName}`}
                className="w-72 h-72 rounded-3xl object-cover shadow-xl mb-4"
              />
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-1 text-center">
              {player?.firstName} {player?.lastName}
            </h1>
            {player?.teamName && <p className="text-2xl text-gray-600 mb-2">{player.teamName}</p>}
            {player?.graduationYear && (
              <p className="text-lg text-gray-400">Class of {player.graduationYear}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
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
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-4xl py-4 px-16 rounded-full shadow-2xl">
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
  <div className={`text-center p-2 rounded-lg ${highlight ? 'bg-blue-100' : 'bg-gray-50'}`}>
    <div className="text-sm font-semibold text-gray-600">{label}</div>
    <div className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
      {value}
    </div>
  </div>
);
