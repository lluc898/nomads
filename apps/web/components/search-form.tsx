import { LocationCombobox } from "./location-combobox";
import { TravelDatePicker } from "./travel-date-picker";
import { SearchIcon } from "./icons";

export function SearchForm() {
  return (
    <form
      action="/buscar"
      className="rounded-2xl border border-white/60 bg-white shadow-[0_18px_50px_rgba(15,23,42,.18)] md:flex md:items-stretch"
    >
      <LocationCombobox
        label="Desde"
        name="origen"
        placeholder="País o aeropuerto"
      />
      <LocationCombobox
        label="Hacia"
        name="destino"
        placeholder="Cualquier lugar"
        includeAnywhere
      />
      <TravelDatePicker />
      <div className="p-2.5 md:flex md:items-stretch">
        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6EFD] px-5 font-bold text-white transition hover:bg-[#0857C9] md:w-auto"
          type="submit"
        >
          <SearchIcon className="size-[18px]" />
          <span className="md:hidden lg:inline">Buscar viajes</span>
        </button>
      </div>
    </form>
  );
}
