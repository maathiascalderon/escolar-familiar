export async function parsearMensajeEscolar(texto) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("No hay API KEY de Gemini. Simulando el retorno de la Inteligencia Artificial...");
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        hija: "Florencia",
        tipo: "Prueba",
        asignatura: "Historia Universal",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "Comprende unidades 1 y 2. Resumen IA Simulado."
      }), 1500);
    });
  }

  const prompt = `
Eres un asistente virtual que extrae información escolar de tres niñas: Florencia, Pía y Francisca.
Devuelve ÚNICAMENTE JSON válido, de esta estructura:
{ "hija": "Florencia" | "Pía" | "Francisca", "tipo": "Prueba" | "Tarea" | "Reunión" | "Actividad", "asignatura": "String", "fecha": "YYYY-MM-DD", "descripcion": "String" }

Mensaje: "${texto}"
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en Gemini API');
    }

    const jsonStr = data.candidates[0].content.parts[0].text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parseando con IA:', error);
    throw error;
  }
}
