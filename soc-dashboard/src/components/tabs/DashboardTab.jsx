import RiskGauge from '../RiskGauge';
import StatsCards from '../StatsCards';
import AttackChart from '../AttackChart';
import AttackMap from '../AttackMap';
import AlertFeed from '../AlertFeed';

export default function DashboardTab({ riskScore, anomaly, stats, chartData, attacks, theme, handleExplain }) {
  return (
    <>
      <RiskGauge riskScore={riskScore} anomaly={anomaly} />
      <StatsCards stats={stats} />
      <div className="grid-2 section">
        <AttackChart data={chartData} />
        <AttackMap attacks={attacks} theme={theme} />
      </div>
      <AlertFeed attacks={attacks} onExplain={handleExplain} />
    </>
  );
}
