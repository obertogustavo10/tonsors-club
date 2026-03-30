import { Button } from "@radix-ui/themes";
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Calendar, Users, MapPin, Star } from 'lucide-react';
import { motion } from "motion/react"
import logoTonsors from "../assets/logo-tonsors-dorado.png";
import barberiaBg from "../assets/barberia.png";
import InstallAppButton from "../components/pwa/InstallAppButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${barberiaBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-emerald-900/35 to-slate-900" />

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <Link
            to="/admin"
            aria-label="Abrir panel"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-300 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
          >
            <Shield className="h-5 w-5" />
          </Link>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-2">
                 <div className="rounded-xl overflow-hidden">
                   <img
                     src={logoTonsors}
                     alt="Tonsors Club Logo"
                     className="w-50 h-50 md:w-20 md:h-20 object-contain"
                   />
                 </div>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6">
              Tonsor's{" "}
              <span className="bg-gradient-to-b from-[#fff1b8] via-[#f4c95d] to-[#b8860b] bg-clip-text text-transparent">
                Club
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              La mejor experiencia en barbería. Reserva tu cita en minutos y disfruta de un servicio premium.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/client">
                <Button className="w-full sm:w-auto bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 hover:from-amber-200 hover:via-amber-400 hover:to-amber-600 text-black font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-500/30">
                  <Calendar className="w-6 h-6 mr-2" />
                  Reservar Cita
                </Button>
              </Link>
              <InstallAppButton />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">3 Sucursales</h3>
            <p className="text-slate-400">
              Con ubicaciones estrategicas, para tu comodidad.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Barberos Expertos</h3>
            <p className="text-slate-400">
              Profesionales certificados con años de experiencia en el rubro.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6">
              <Star className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">+4.8 Rating</h3>
            <p className="text-slate-400">
              Miles de clientes satisfechos nos respaldan con sus reseñas.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 Tonsor's Club - Barber App</p>
        </div>
      </div>
    </div>
  );
}
