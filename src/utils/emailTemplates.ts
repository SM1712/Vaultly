/**
 * HTML templates for email notifications, styled with Vaultly's premium "Obsidian & Glassmorphism" layout.
 * Supports multiple selectable themes: 'claro' | 'oscuro' | 'indigo'.
 */

const getBaseLayout = (
  title: string,
  contentHtml: string,
  accentColor: string = '#10b981',
  theme: 'claro' | 'oscuro' | 'indigo' = 'oscuro'
) => {
  let bg = '#09090b';
  let cardBg = '#0e0e11';
  let text = '#d4d4d8';
  let titleColor = '#ffffff';
  let border = '#1f1f23';
  let labelColor = '#94949e';
  let glassBg = 'rgba(255, 255, 255, 0.025)';
  let glassBorder = 'rgba(255, 255, 255, 0.06)';

  if (theme === 'claro') {
    bg = '#f8fafc';
    cardBg = '#ffffff';
    text = '#334155';
    titleColor = '#0f172a';
    border = '#e2e8f0';
    labelColor = '#64748b';
    glassBg = 'rgba(15, 23, 42, 0.02)';
    glassBorder = 'rgba(15, 23, 42, 0.06)';
  } else if (theme === 'indigo') {
    bg = '#06070b';
    cardBg = '#0b0d16';
    text = '#c7cbdf';
    titleColor = '#ffffff';
    border = '#1b1e2e';
    labelColor = '#8086a2';
    glassBg = 'rgba(99, 102, 241, 0.035)';
    glassBorder = 'rgba(99, 102, 241, 0.09)';
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@500;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: ${bg};
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: ${text};
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 36px 28px;
          background-color: ${cardBg};
          border: 1px solid ${border};
          border-top: 4px solid ${accentColor};
          border-radius: 20px;
          box-shadow: ${theme === 'claro' ? '0 10px 30px rgba(9, 9, 11, 0.03)' : '0 20px 40px rgba(0, 0, 0, 0.4)'};
        }
        .header {
          text-align: center;
          margin-bottom: 28px;
        }
        .logo {
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: ${theme === 'claro' ? '#0f172a' : '#ffffff'};
          letter-spacing: 0.05em;
          text-decoration: none;
          display: inline-block;
        }
        .logo span {
          color: ${accentColor};
          font-weight: 300;
          opacity: 0.85;
        }
        .hero {
          text-align: center;
          margin-bottom: 28px;
          padding: 10px 0;
        }
        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: ${titleColor};
          margin: 16px 0 8px 0;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }
        .hero-subtitle {
          font-size: 14px;
          color: ${labelColor};
          margin: 0;
          line-height: 1.55;
        }
        .glass-panel {
          background-color: ${glassBg};
          border: 1px solid ${glassBorder};
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 28px;
        }
        .btn {
          display: inline-block;
          background-color: ${accentColor};
          color: ${accentColor === '#ffffff' ? '#0f172a' : (theme === 'claro' ? '#ffffff' : '#09090b')} !important;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 13.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          font-size: 11px;
          color: ${labelColor};
          line-height: 1.6;
          border-top: 1px solid ${border};
          padding-top: 20px;
        }
        .footer a {
          color: ${accentColor};
          text-decoration: none;
          font-weight: 600;
        }
        .grid {
          display: table;
          width: 100%;
          margin-bottom: 8px;
        }
        .grid-row {
          display: table-row;
        }
        .grid-cell {
          display: table-cell;
          padding: 7px 0;
          font-size: 13.5px;
          border-bottom: 1px solid ${theme === 'claro' ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.02)'};
        }
        .grid-row:last-child .grid-cell {
          border-bottom: none;
        }
        .grid-label {
          color: ${labelColor};
          text-align: left;
        }
        .grid-value {
          text-align: right;
          font-weight: 600;
          color: ${titleColor};
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: ${theme === 'claro' ? 'rgba(15,23,42,0.04)' : 'rgba(255, 255, 255, 0.05)'};
          color: ${theme === 'claro' ? '#475569' : '#cbd5e1'};
          border: 1px solid ${theme === 'claro' ? 'rgba(15,23,42,0.08)' : 'rgba(255, 255, 255, 0.08)'};
        }
        .accent-text {
          color: ${accentColor};
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VAULT<span>LY</span></div>
        </div>
        ${contentHtml}
        <div class="footer">
          Este correo ha sido generado por el sistema automático de alertas de Vaultly.<br>
          Puede actualizar sus preferencias de recepción desde los <a href="#">Ajustes del Sistema</a>.<br>
          &copy; ${new Date().getFullYear()} Vaultly Finance. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getTestEmailTemplate = (userDisplayName: string, theme: 'claro' | 'oscuro' | 'indigo' = 'oscuro') => {
  const content = `
    <div class="hero">
      <div class="badge" style="border-color: rgba(99, 102, 241, 0.3); color: #818cf8; background-color: rgba(99, 102, 241, 0.15);">VINCULACIÓN DE CANAL</div>
      <h1 class="hero-title">Canal de Notificaciones Vinculado</h1>
      <p class="hero-subtitle">Estimado/a ${userDisplayName}, confirmamos que su canal de mensajería asíncrona de Vaultly se encuentra activo y configurado con éxito.</p>
    </div>
    
    <div class="glass-panel">
      <h3 style="margin-top: 0; font-family: 'Outfit', sans-serif; font-size: 15px; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; border-bottom: 1px solid rgba(128, 128, 128, 0.15); padding-bottom: 8px; margin-bottom: 12px;">Sincronización del Dispositivo</h3>
      <p style="font-size: 13.5px; color: ${theme === 'claro' ? '#334155' : '#a1a1aa'}; line-height: 1.5; margin-bottom: 20px;">
        A partir de este momento, recibirá análisis avanzados, alertas de límites presupuestarios y reportes de hitos financieros directamente en su bandeja de entrada para optimizar su toma de decisiones.
      </p>
      <div class="grid">
        <div class="grid-row">
          <div class="grid-cell grid-label">Estado de Enlace</div>
          <div class="grid-cell grid-value" style="color: #10b981;">ACTIVO Y EN LÍNEA</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Protocolo Utilizado</div>
          <div class="grid-cell grid-value">SMTP Secure Relay</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Proveedor de Acceso</div>
          <div class="grid-cell grid-value">Firebase Auth</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Fecha de Registro</div>
          <div class="grid-cell grid-value">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="#" class="btn" style="background-color: #6366f1;">Ir a mi Consola Financiera</a>
    </div>
  `;
  return getBaseLayout("Canal Vinculado - Vaultly", content, "#6366f1", theme);
};

export const getGoalMilestoneTemplate = (
  goalName: string,
  progressPercent: number,
  currentAmount: number,
  targetAmount: number,
  userDisplayName: string,
  theme: 'claro' | 'oscuro' | 'indigo' = 'oscuro'
) => {
  const isCompleted = progressPercent >= 100;
  const badgeText = isCompleted ? "🏆 META CONSOLIDADA" : "🌟 HITO SUPERADO";
  const accentColor = isCompleted ? "#10b981" : "#8b5cf6"; // Emerald green for complete, Purple/Violet for milestone
  const heroTitle = isCompleted ? "¡Meta Financiera Alcanzada!" : `Hito de Ahorro: Avance al ${progressPercent}%`;
  const heroSubtitle = isCompleted
    ? `Felicitaciones, ${userDisplayName}. Ha completado exitosamente el 100% de los fondos asignados para su objetivo.`
    : `Estimado/a ${userDisplayName}, su capital destinado para este objetivo ha superado un hito relevante de ahorro.`;

  const visualCard = isCompleted
    ? `
      <div style="text-align: center; padding: 16px 0 20px 0; border: 1.5px dashed rgba(16, 185, 129, 0.3); border-radius: 12px; margin-bottom: 20px; background-color: rgba(16, 185, 129, 0.02);">
        <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎉</span>
        <strong style="color: #10b981; font-family: 'Outfit', sans-serif; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Objetivo Consolidado</strong>
        <p style="font-size: 12px; color: ${theme === 'claro' ? '#64748b' : '#94949e'}; margin: 4px 0 0 0;">Esta meta ha sido transferida a su historial de logros.</p>
      </div>
      `
    : `
      <!-- Progress Bar Visual representation in email -->
      <div style="background-color: ${theme === 'claro' ? '#e2e8f0' : '#1f1f23'}; border-radius: 9999px; height: 10px; width: 100%; margin: 16px 0 20px 0; overflow: hidden; border: 1px solid ${theme === 'claro' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'};">
        <div style="background-color: ${accentColor}; height: 100%; width: ${Math.min(100, progressPercent)}%; border-radius: 9999px;"></div>
      </div>
      `;

  const content = `
    <div class="hero">
      <div class="badge" style="border-color: ${accentColor}40; color: ${accentColor}; background-color: ${accentColor}15;">${badgeText}</div>
      <h1 class="hero-title">${heroTitle}</h1>
      <p class="hero-subtitle">${heroSubtitle}</p>
    </div>
    
    <div class="glass-panel">
      <h3 style="margin-top: 0; font-family: 'Outfit', sans-serif; font-size: 15px; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; border-bottom: 1px solid rgba(128, 128, 128, 0.15); padding-bottom: 8px; margin-bottom: 16px;">Resumen del Balance</h3>
      
      ${visualCard}

      <div class="grid">
        <div class="grid-row">
          <div class="grid-cell grid-label">Denominación de Meta</div>
          <div class="grid-cell grid-value" style="font-family: inherit; font-size: 13.5px; font-weight: 700;">${goalName}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Capital Acumulado</div>
          <div class="grid-cell grid-value" style="color: #10b981;">$${currentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Objetivo de Ahorro</div>
          <div class="grid-cell grid-value">$${targetAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Tasa de Cobertura</div>
          <div class="grid-cell grid-value">${progressPercent}%</div>
        </div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="#" class="btn" style="background-color: ${accentColor};">${isCompleted ? 'Ver mis Objetivos' : 'Añadir Aportes'}</a>
    </div>
  `;
  return getBaseLayout(`${badgeText}: ${goalName}`, content, accentColor, theme);
};

export const getBudgetAlertTemplate = (
  categoryName: string,
  spentAmount: number,
  limitAmount: number,
  userDisplayName: string,
  theme: 'claro' | 'oscuro' | 'indigo' = 'oscuro'
) => {
  const diff = spentAmount - limitAmount;
  const percent = Math.round((spentAmount / limitAmount) * 100);

  const content = `
    <div class="hero">
      <div class="badge" style="border-color: rgba(244, 63, 94, 0.3); color: #fb7185; background-color: rgba(244, 63, 94, 0.15);">⚠️ DESVIACIÓN PRESUPUESTARIA</div>
      <h1 class="hero-title" style="color: #f43f5e;">Límite Excedido en "${categoryName}"</h1>
      <p class="hero-subtitle">Estimado/a ${userDisplayName}, le informamos que sus registros de egresos en esta categoría han sobrepasado el límite mensual establecido.</p>
    </div>
    
    <div class="glass-panel" style="border-color: rgba(244, 63, 94, 0.25);">
      <h3 style="margin-top: 0; font-family: 'Outfit', sans-serif; font-size: 15px; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; border-bottom: 1px solid rgba(244, 63, 94, 0.15); padding-bottom: 8px; margin-bottom: 16px;">Métricas de Exceso</h3>
      
      <div style="background-color: ${theme === 'claro' ? '#e2e8f0' : '#1f1f23'}; border-radius: 9999px; height: 10px; width: 100%; margin: 16px 0 20px 0; overflow: hidden; border: 1px solid ${theme === 'claro' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'};">
        <div style="background-color: #f43f5e; height: 100%; width: 100%; border-radius: 9999px;"></div>
      </div>

      <div class="grid">
        <div class="grid-row">
          <div class="grid-cell grid-label">Categoría Afectada</div>
          <div class="grid-cell grid-value" style="font-family: inherit; font-size: 13.5px; font-weight: 700;">${categoryName}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Gasto Acumulado</div>
          <div class="grid-cell grid-value" style="color: #f43f5e;">$${spentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Límite Establecido</div>
          <div class="grid-cell grid-value">$${limitAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Margen Excedido</div>
          <div class="grid-cell grid-value" style="color: #fb7185;">+$${diff.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}%)</div>
        </div>
      </div>
      
      <p style="font-size: 12.5px; color: ${theme === 'claro' ? '#334155' : '#a1a1aa'}; line-height: 1.6; margin-top: 18px; margin-bottom: 0;">
        <strong>Sugerencia de Control:</strong> Se recomienda moderar gastos no esenciales en esta categoría durante el resto del período fiscal o reajustar los límites dentro de la consola Vaultly.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="#" class="btn" style="background-color: #f43f5e;">Ajustar Presupuestos</a>
    </div>
  `;
  return getBaseLayout(`Alerta de Límite Excedido: ${categoryName}`, content, "#f43f5e", theme);
};

export const getProjectInvitationTemplate = (
  projectName: string,
  inviterNickname: string,
  userDisplayName: string,
  theme: 'claro' | 'oscuro' | 'indigo' = 'oscuro'
) => {
  const content = `
    <div class="hero">
      <div class="badge" style="border-color: rgba(99, 102, 241, 0.3); color: #818cf8; background-color: rgba(99, 102, 241, 0.15);">👥 COLABORACIÓN MULTI-CUENTA</div>
      <h1 class="hero-title">Invitación a Portafolio Conjunto</h1>
      <p class="hero-subtitle">Estimado/a ${userDisplayName}, ha sido invitado/a a co-administrar un espacio financiero compartido.</p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 54px; height: 54px; line-height: 54px; border-radius: 50%; background-color: rgba(99, 102, 241, 0.08); border: 1.5px solid #6366f1; color: #6366f1; font-weight: 700; font-size: 18px; display: inline-block; font-family: 'Outfit', sans-serif;">
        ${inviterNickname.substring(0, 2).toUpperCase()}
      </div>
    </div>
    
    <div class="glass-panel">
      <h3 style="margin-top: 0; font-family: 'Outfit', sans-serif; font-size: 15px; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; border-bottom: 1px solid rgba(128, 128, 128, 0.15); padding-bottom: 8px; margin-bottom: 16px;">Propuesta de Acceso</h3>
      <p style="font-size: 13.5px; color: ${theme === 'claro' ? '#334155' : '#a1a1aa'}; line-height: 1.6; margin-bottom: 20px;">
        El usuario <strong class="accent-text" style="color: #6366f1;">@${inviterNickname}</strong> le solicita participar en el portafolio <strong>"${projectName}"</strong>. 
        Al aceptar la solicitud, podrá registrar transacciones, coordinar presupuestos mutuos y monitorear el balance consolidado en tiempo real.
      </p>
      <div class="grid">
        <div class="grid-row">
          <div class="grid-cell grid-label">Portafolio Destino</div>
          <div class="grid-cell grid-value" style="font-family: inherit; font-size: 13.5px; font-weight: 700;">${projectName}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Remitente</div>
          <div class="grid-cell grid-value">@${inviterNickname}</div>
        </div>
        <div class="grid-row">
          <div class="grid-cell grid-label">Rol Asignado</div>
          <div class="grid-cell grid-value" style="color: #6366f1;">Colaborador (Editor)</div>
        </div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="#" class="btn" style="background-color: #6366f1;">Aceptar Colaboración</a>
    </div>
  `;
  return getBaseLayout(`Invitación a colaborar: ${projectName}`, content, "#6366f1", theme);
};

export const getWeeklyBudgetControlTemplate = (
  userDisplayName: string,
  currency: string,
  categoriesData: Array<{ name: string; spent: number; limit: number; percent: number }>,
  globalLimit: { enabled: boolean; amount: number; spent: number; percent: number },
  theme: 'claro' | 'oscuro' | 'indigo' = 'oscuro'
) => {
  let categoriesHtml = '';
  
  if (categoriesData.length === 0) {
    categoriesHtml = `
      <p style="text-align: center; font-size: 13.5px; color: ${theme === 'claro' ? '#64748b' : '#94949e'}; font-style: italic; margin: 20px 0; display: block; clear: both;">
        No existen límites de presupuestos configurados para el período actual.
      </p>
    `;
  } else {
    categoriesData.forEach(cat => {
      const isExceeded = cat.spent > cat.limit;
      const progressBg = isExceeded ? '#f43f5e' : (cat.percent >= 80 ? '#fb923c' : '#10b981');
      const badgeStyle = isExceeded 
        ? 'border-color: rgba(244, 63, 94, 0.3); color: #fb7185; background-color: rgba(244, 63, 94, 0.1);' 
        : 'border-color: rgba(16, 185, 129, 0.3); color: #34d399; background-color: rgba(16, 185, 129, 0.1);';
      const badgeText = isExceeded ? 'EXCEDIDO' : 'DENTRO';

      categoriesHtml += `
        <div style="padding: 14px 0; border-bottom: 1px solid ${theme === 'claro' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)'}; display: block; clear: both; width: 100%;">
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; table-layout: fixed; margin-bottom: 4px;">
            <tr>
              <td align="left" style="font-weight: 700; font-size: 14px; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; padding: 0;">
                ${cat.name}
              </td>
              <td align="right" style="padding: 0; width: 100px;">
                <span class="badge" style="${badgeStyle}">${badgeText}</span>
              </td>
            </tr>
          </table>
          
          <!-- Progress bar container -->
          <div style="background-color: ${theme === 'claro' ? '#f1f5f9' : '#1f1f23'}; border-radius: 9999px; height: 8px; width: 100%; margin: 10px 0; overflow: hidden; display: block; clear: both; border: 1px solid ${theme === 'claro' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'};">
            <div style="background-color: ${progressBg}; height: 8px; width: ${Math.min(100, cat.percent)}%; border-radius: 9999px; display: block;"></div>
          </div>
          
          <!-- Progress metrics table -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; table-layout: fixed; font-size: 12px; color: ${theme === 'claro' ? '#64748b' : '#94949e'};">
            <tr>
              <td align="left" style="padding: 0;">
                Consumido: <strong style="color: ${theme === 'claro' ? '#0f172a' : '#ffffff'};">${cat.percent.toFixed(0)}%</strong>
              </td>
              <td align="right" style="padding: 0; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'};">
                ${currency}${cat.spent.toLocaleString()} / ${currency}${cat.limit.toLocaleString()}
              </td>
            </tr>
          </table>
          
        </div>
      `;
    });
  }

  let globalLimitHtml = '';
  if (globalLimit.enabled && globalLimit.amount > 0) {
    const globalExceeded = globalLimit.spent > globalLimit.amount;
    const globalProgressBg = globalExceeded ? '#f43f5e' : (globalLimit.percent >= 80 ? '#fb923c' : '#10b981');
    globalLimitHtml = `
      <div class="glass-panel" style="border-color: ${globalExceeded ? 'rgba(244, 63, 94, 0.3)' : 'rgba(99, 102, 241, 0.25)'}; margin-bottom: 24px; display: block; clear: both; width: 100%; box-sizing: border-box;">
        <h3 style="margin-top: 0; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; font-family: 'Outfit', sans-serif; font-size: 15px; border-bottom: 1px solid rgba(128, 128, 128, 0.15); padding-bottom: 8px; margin-bottom: 12px; display: block;">Límite Global Consolidado</h3>
        
        <div style="background-color: ${theme === 'claro' ? '#f1f5f9' : '#1f1f23'}; border-radius: 9999px; height: 10px; width: 100%; margin: 12px 0; overflow: hidden; display: block; clear: both; border: 1px solid ${theme === 'claro' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'};">
          <div style="background-color: ${globalProgressBg}; height: 10px; width: ${Math.min(100, globalLimit.percent)}%; border-radius: 9999px; display: block;"></div>
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; table-layout: fixed; margin-top: 14px;">
          <tr style="border-bottom: 1px solid rgba(128,128,128,0.1);">
            <td align="left" style="padding: 6px 0; font-size: 13.5px; color: ${theme === 'claro' ? '#64748b' : '#94949e'};">Gasto Acumulado</td>
            <td align="right" style="padding: 6px 0; font-size: 13.5px; font-weight: 700; color: ${globalExceeded ? '#f43f5e' : (theme === 'claro' ? '#0f172a' : '#ffffff')}; font-family: 'JetBrains Mono', monospace;">${currency}${globalLimit.spent.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(128,128,128,0.1);">
            <td align="left" style="padding: 6px 0; font-size: 13.5px; color: ${theme === 'claro' ? '#64748b' : '#94949e'};">Límite Establecido</td>
            <td align="right" style="padding: 6px 0; font-size: 13.5px; font-weight: 700; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; font-family: 'JetBrains Mono', monospace;">${currency}${globalLimit.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td align="left" style="padding: 6px 0; font-size: 13.5px; color: ${theme === 'claro' ? '#64748b' : '#94949e'};">Tasa de Consumo</td>
            <td align="right" style="padding: 6px 0; font-size: 13.5px; font-weight: 700; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; font-family: 'JetBrains Mono', monospace;">${globalLimit.percent.toFixed(0)}%</td>
          </tr>
        </table>
      </div>
    `;
  }

  const content = `
    <div class="hero" style="display: block; text-align: center;">
      <div class="badge" style="border-color: rgba(99, 102, 241, 0.3); color: #818cf8; background-color: rgba(99, 102, 241, 0.15); display: inline-block;">📊 CONTROL PRESUPUESTARIO</div>
      <h1 class="hero-title" style="display: block;">Reporte de Consumo Semanal</h1>
      <p class="hero-subtitle" style="display: block;">Estimado/a ${userDisplayName}, le presentamos el estado consolidado de sus presupuestos mensuales activos para supervisar su tasa de consumo.</p>
    </div>

    ${globalLimitHtml}

    <div class="glass-panel" style="display: block; clear: both; width: 100%; box-sizing: border-box;">
      <h3 style="margin-top: 0; color: ${theme === 'claro' ? '#0f172a' : '#ffffff'}; font-family: 'Outfit', sans-serif; font-size: 15px; border-bottom: 1px solid rgba(128, 128, 128, 0.15); padding-bottom: 8px; margin-bottom: 12px; display: block;">Desglose por Categorías</h3>
      <div style="display: block; width: 100%;">
        ${categoriesHtml}
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px; display: block; clear: both;">
      <a href="#" class="btn" style="background-color: #6366f1; display: inline-block;">Optimizar Ajustes</a>
    </div>
  `;

  return getBaseLayout("Reporte de Control Semanal - Vaultly", content, "#6366f1", theme);
};
