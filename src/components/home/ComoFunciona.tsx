const pasos = [
  {
    titulo: "1. Elige tu modelo",
    texto: "Explora el catálogo y escoge el closet, librero o vestidor que más te guste.",
  },
  {
    titulo: "2. Pon tus medidas",
    texto: "Indica las medidas de tu espacio para conocer tu precio.",
  },
  {
    titulo: "3. Cierra por WhatsApp",
    texto: "Envía tu diseño y un asesor te ayuda a completar tu compra.",
  },
];

export default function ComoFunciona() {
  return (
    <section className="bg-secondary/50 py-16 lg:py-24">
      <div className="container-custom">
        <h2 className="text-center text-3xl font-bold lg:text-4xl">Cómo funciona</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pasos.map((paso) => (
            <article key={paso.titulo} className="rounded-2xl bg-card p-8 shadow-soft">
              <h3 className="text-lg">{paso.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{paso.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
