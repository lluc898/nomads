import { PlaceholderScreen } from "@/components/placeholder-screen";
import { useI18n } from "@/lib/i18n-context";
export default function CreateScreen() {
  const { t } = useI18n();
  return (
    <PlaceholderScreen
      title={t("createTrip")}
      description={t("createTripDescription")}
    />
  );
}
