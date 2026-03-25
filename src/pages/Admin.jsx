import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Scissors,
  CalendarDays,
  Users,
  MapPin,
  Settings,
} from "lucide-react";
import BookingsTab from "../components/admin/BookingsTab";
import BarbersTab from "../components/admin/BarbersTab";
import BranchesTab from "../components/admin/BranchesTab";
import ServicesTab from "../components/admin/ServicesTab";
import { listSucursales } from "../service/sucursales.api";
import { listServicios } from "../service/servicios.api";
import { listBarberos } from "../service/barberos.api";
import { listTurnos } from "../service/turnos.service";
import FullPageLoader from "../components/ui/FullPageLoader";

const TABS = [
  { id: "bookings", label: "Reservas", icon: CalendarDays },
  { id: "barbers", label: "Barberos", icon: Users },
  { id: "branches", label: "Sucursales", icon: MapPin },
  { id: "services", label: "Servicios", icon: Scissors },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nextBranches, nextServices, nextBarbers, nextBookings] =
        await Promise.all([
          listSucursales(),
          listServicios(),
          listBarberos(),
          listTurnos(),
        ]);

      setBranches(nextBranches);
      setServices(nextServices);
      setBarbers(nextBarbers);
      setBookings(nextBookings);
    } catch (error) {
      console.error("Error cargando admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "barbers":
        return (
          <BarbersTab
            barbers={barbers}
            branches={branches}
            onRefresh={loadData}
          />
        );
      case "branches":
        return <BranchesTab branches={branches} onRefresh={loadData} />;
      case "services":
        return <ServicesTab services={services} onRefresh={loadData} />;
      case "bookings":
      default:
        return (
          <BookingsTab
            bookings={bookings}
            branches={branches}
            services={services}
            barbers={barbers}
            onRefresh={loadData}
          />
        );
    }
  }, [activeTab, barbers, branches, bookings, services]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <FullPageLoader show={loading} label="Cargando panel" />

      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Settings className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Panel de Administracion
                </h1>
                <p className="text-slate-400 text-sm">Tonsors Club</p>
              </div>
            </div>
            <Link
              to="/Client"
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
            >
              Ver cliente
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-amber-400 bg-amber-500 text-black"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {tabContent}
      </div>
    </div>
  );
}
