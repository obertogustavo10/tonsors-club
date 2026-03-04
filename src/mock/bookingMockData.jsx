export const mockBranches = [
  {
    id: "b1",
    name: "Sucursal Centro",
    address: "Av. Principal 123",
    phone: "+54 11 1234 5678",
    hours: "Lun-Sáb 09:00–20:00",
  },
  {
    id: "b2",
    name: "Sucursal Norte",
    address: "Calle 9 #456",
    phone: "+54 11 2222 1111",
    hours: "Lun-Dom 10:00–22:00",
  },
];

export const mockServices = [
  { id: "s1", name: "Corte clásico", description: "Corte + terminaciones", duration: 30, price: 10 },
  { id: "s2", name: "Barba premium", description: "Barba + toalla caliente", duration: 30, price: 12 },
  { id: "s3", name: "Corte + Barba", description: "Combo completo", duration: 60, price: 18 },
];

export const mockBarbers = [
  { id: "u1", branch_id: "b1", name: "Leo", specialty: "Fade / Degradados", rating: 4.9, reviews: 210 },
  { id: "u2", branch_id: "b1", name: "Nico", specialty: "Clásico / Tijera", rating: 4.8, reviews: 155 },
  { id: "u3", branch_id: "b2", name: "Mati", specialty: "Barba / Perfilado", rating: 4.7, reviews: 98 },
];

export const mockBookings = [
  // ejemplo: { date: "2026-03-02", time: "11:30" }
];