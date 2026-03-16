import React from "react";
import { useI18n } from "../i18n";

const FilterBar: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="border-b border-black/5 px-5 py-4">
      <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {t("filterText")}
      </div>
    </div>
  );
};

export default FilterBar;

