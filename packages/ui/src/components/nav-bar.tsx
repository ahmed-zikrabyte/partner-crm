"use client";
import type { ReactNode } from "react";

interface NavBarProps {
  label: string;
  filtersComponent?: ReactNode; // ✅ Replaces `searchComponent`
  button?: ReactNode;
  uploadButton?: ReactNode;
  downloadTemplateButton?: ReactNode;
  optionButton?: ReactNode;
}

const NavBar = ({
  label,
  filtersComponent,
  button,
  uploadButton,
  downloadTemplateButton,
  optionButton,
}: NavBarProps) => {
  return (
    <div className="w-full bg-white shadow-md rounded-md px-4 md:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Label */}
        <div className="text-lg font-bold">{label}</div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Upload button */}
          {uploadButton && <div className="cursor-pointer">{uploadButton}</div>}

          {/* Download template button */}
          {downloadTemplateButton && (
            <div className="cursor-pointer">{downloadTemplateButton}</div>
          )}

          {/* Option button */}
          {optionButton && <div className="cursor-pointer">{optionButton}</div>}

          {/* Primary action button */}
          {button && <div className="cursor-pointer">{button}</div>}

          {/* Filters (search/date/dropdown) */}
          {filtersComponent && (
            <div className="flex gap-2 flex-wrap">{filtersComponent}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
