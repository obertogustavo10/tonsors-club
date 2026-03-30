import React, { useEffect, useMemo, useState } from "react";
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
import AvailabilityTab from "../components/admin/AvailabilityTab";
import { listSucursales } from "../service/sucursales.api";
import { listServicios } from "../service/servicios.api";
import { listBarberos } from "../service/barberos.api";
import { listTurnos, listTurnosByBarbero } from "../service/turnos.service";
import { getUserProfilesByIds } from "../service/auth.service";
import FullPageLoader from "../components/ui/FullPageLoader";
import { useAuth } from "../context/AuthContext";

const ADMIN_TABS = [
  { id: "bookings", label: "Reservas", icon: CalendarDays },
  { id: "barbers", label: "Barberos", icon: Users },
  { id: "availability", label: "Bloqueos", icon: CalendarDays },
  { id: "branches", label: "Sucursales", icon: MapPin },
  { id: "services", label: "Servicios", icon: Scissors },
];

const BARBER_TABS = [
  { id: "bookings", label: "Mis turnos", icon: CalendarDays },
  { id: "barbers", label: "Mi perfil", icon: Users },
  { id: "availability", label: "Mis bloqueos", icon: CalendarDays },
];

export default function Admin() {
  const { profile, barberProfile, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [userProfilesMap, setUserProfilesMap] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [nextBranches, nextServices, nextBarbers, nextBookings] =
        await Promise.all([
          listSucursales(),
          listServicios(),
          isAdmin ? listBarberos() : Promise.resolve([]),
          isAdmin ? listTurnos() : listTurnosByBarbero(barberProfile?.id),
        ]);

      setBranches(nextBranches);
      setServices(nextServices);
      const visibleBarbers = isAdmin
        ? nextBarbers
        : barberProfile
          ? [barberProfile]
          : [];
      setBarbers(visibleBarbers);
      setBookings(nextBookings);

      if (isAdmin) {
        const userUids = visibleBarbers.map(
          (barber) => barber.authUid || barber.userUid
        );
        const nextProfilesMap = await getUserProfilesByIds(userUids);
        setUserProfilesMap(nextProfilesMap);
      } else {
        setUserProfilesMap(
          profile?.uid && profile ? { [profile.uid]: profile } : {}
        );
      }
    } catch (error) {
      console.error("Error cargando admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile?.uid, profile?.rol, barberProfile?.id]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Error cerrando sesion:", error);
      setLoggingOut(false);
    }
  };

  const tabs = isAdmin ? ADMIN_TABS : BARBER_TABS;

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "barbers":
        return (
          <BarbersTab
            barbers={isAdmin ? barbers : barberProfile ? [barberProfile] : []}
            branches={branches}
            canManage={isAdmin}
            userProfilesMap={userProfilesMap}
            onRefresh={loadData}
          />
        );
      case "availability":
        return (
          <AvailabilityTab
            canManage={isAdmin}
            barbers={barbers}
            selectedBarber={barberProfile}
          />
        );
      case "branches":
        return isAdmin ? (
          <BranchesTab branches={branches} onRefresh={loadData} />
        ) : null;
      case "services":
        return isAdmin ? (
          <ServicesTab services={services} onRefresh={loadData} />
        ) : null;
      case "bookings":
      default:
        return (
          <BookingsTab
            bookings={bookings}
            branches={branches}
            services={services}
            barbers={isAdmin ? barbers : barberProfile ? [barberProfile] : []}
            canManage={isAdmin}
            onRefresh={loadData}
          />
        );
    }
  }, [
    activeTab,
    barbers,
    barberProfile,
    branches,
    bookings,
    isAdmin,
    profile,
    services,
    userProfilesMap,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <FullPageLoader
        show={loading || loggingOut}
        label={loggingOut ? "Cerrando sesion" : "Cargando panel"}
      />

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
                <p className="text-slate-400 text-sm">
                  {isAdmin ? "Administrador" : "Panel de barbero"}
                  {profile?.nombre
                    ? ` - ${profile.nombre} ${profile.apellido || ""}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
{/*               <Link
                to="/Client"
                className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
              >
                Ver cliente
              </Link> */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => {
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
