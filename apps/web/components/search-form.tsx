import { LocationCombobox } from "./location-combobox";
import { CalendarIcon, SearchIcon, UsersIcon } from "./icons";

const Field = ({
  icon,
  label,
  name,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  placeholder: string;
}) => (
  <label className="group flex min-h-[68px] flex-1 items-center gap-3 border-b border-slate-200 px-4 py-3 transition hover:bg-slate-50 md:border-r md:border-b-0">
    <span className="text-[#0B6EFD]">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-xs font-semibold text-slate-500">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
      />
    </span>
  </label>
);

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
      <Field
        icon={<CalendarIcon />}
        label="Cuándo"
        name="fecha"
        placeholder="Elige fechas o mes"
      />
      <Field
        icon={<UsersIcon />}
        label="Viajeros"
        name="viajeros"
        placeholder="1 viajero"
      />
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
