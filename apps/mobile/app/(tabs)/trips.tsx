import { PlaceholderScreen } from "@/components/placeholder-screen";
import { useI18n } from "@/lib/i18n-context";
export default function TripsScreen() {
  const { t } = useI18n();
  return (
    <PlaceholderScreen
      title={t("myTrips")}
      description={t("myTripsDescription")}
    />
  );
}
