import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createRoot } from "react-dom/client";
import { jsPDF } from "jspdf";

import {
  Menu,
  X,
  Plus,
  Search,
  Trash2,
  Edit3,
  FileText,
  Download,
  Upload,
  Building2,
  Package,
  RefreshCw,
  ChevronRight,
  Save,
  AlertTriangle,
  Layers,
  Home,
  PenLine,
  Eraser,
  ArrowLeft,
  Settings,
  ClipboardList
} from "lucide-react";

import "./styles.css";

const STORAGE_KEY = "controle_panos_v2";

const emptyData = {
  buildings: [],
  records: []
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return emptyData;
    }

    const parsed = JSON.parse(raw);

    return {
      buildings: Array.isArray(parsed.buildings)
        ? parsed.buildings
        : [],

      records: Array.isArray(parsed.records)
        ? parsed.records
        : []
    };
  } catch {
    return emptyData;
  }
}

function App() {
  const [data, setData] = useState(loadData);

  const [menuOpen, setMenuOpen] = useState(false);

  /*
    Telas:
    dashboard = painel inicial
    actions   = central do botão +
    building  = prédio
    area      = área
  */
  const [screen, setScreen] = useState("dashboard");

  const [selectedBuildingId, setSelectedBuildingId] =
    useState(null);

  const [selectedAreaId, setSelectedAreaId] =
    useState(null);

  const [search, setSearch] = useState("");

  const [showBuildingForm, setShowBuildingForm] =
    useState(false);

  const [showAreaForm, setShowAreaForm] =
    useState(false);

  const [showRecordForm, setShowRecordForm] =
    useState(false);

  const [editingArea, setEditingArea] =
    useState(null);

  const [editingRecord, setEditingRecord] =
    useState(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  }, [data]);

  const selectedBuilding = data.buildings.find(
    building =>
      building.id === selectedBuildingId
  );

  const selectedArea =
    selectedBuilding?.areas?.find(
      area => area.id === selectedAreaId
    );

  const filteredBuildings = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return data.buildings;
    }

    return data.buildings.filter(building => {
      if (
        String(building.number)
          .toLowerCase()
          .includes(q)
      ) {
        return true;
      }

      return building.areas?.some(area => {
        if (
          area.name
            .toLowerCase()
            .includes(q)
        ) {
          return true;
        }

        return area.clothTypes?.some(type =>
          type.toLowerCase().includes(q)
        );
      });
    });
  }, [data.buildings, search]);

  function goHome() {
    setScreen("dashboard");
    setSelectedBuildingId(null);
    setSelectedAreaId(null);
    setSearch("");
    setMenuOpen(false);
  }

  function openActions() {
    setScreen("actions");
    setSearch("");
    setMenuOpen(false);
  }

  function openBuilding(id) {
    setSelectedBuildingId(id);
    setSelectedAreaId(null);
    setScreen("building");
    setSearch("");
    setMenuOpen(false);
  }

  function openArea(buildingId, areaId) {
    setSelectedBuildingId(buildingId);
    setSelectedAreaId(areaId);
    setScreen("area");
    setSearch("");
    setMenuOpen(false);
  }

  function addBuilding(number) {
    const building = {
      id: crypto.randomUUID(),
      number: number.trim(),
      areas: [],
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      buildings: [
        ...prev.buildings,
        building
      ]
    }));

    setSelectedBuildingId(building.id);
    setSelectedAreaId(null);
    setScreen("building");
  }

  function deleteBuilding(id) {
    const building = data.buildings.find(
      b => b.id === id
    );

    if (
      !confirm(
        `Excluir o prédio ${
          building?.number || ""
        }? Todos os registros das áreas dele também serão excluídos.`
      )
    ) {
      return;
    }

    setData(prev => ({
      buildings: prev.buildings.filter(
        b => b.id !== id
      ),

      records: prev.records.filter(
        r => r.buildingId !== id
      )
    }));

    goHome();
  }

  function addArea(area) {
    setData(prev => ({
      ...prev,

      buildings: prev.buildings.map(
        building => {
          if (
            building.id !==
            selectedBuildingId
          ) {
            return building;
          }

          return {
            ...building,

            areas: [
              ...(building.areas || []),
              area
            ]
          };
        }
      )
    }));

    setSelectedAreaId(area.id);
    setScreen("area");
  }

  function updateArea(area) {
    setData(prev => ({
      ...prev,

      buildings: prev.buildings.map(
        building =>
          building.id ===
          selectedBuildingId
            ? {
                ...building,

                areas:
                  building.areas.map(
                    a =>
                      a.id === area.id
                        ? area
                        : a
                  )
              }
            : building
      )
    }));
  }

  function deleteArea(areaId) {
    if (
      !confirm(
        "Excluir esta área? Os registros relacionados a ela também serão excluídos."
      )
    ) {
      return;
    }

    setData(prev => ({
      buildings: prev.buildings.map(
        building =>
          building.id ===
          selectedBuildingId
            ? {
                ...building,

                areas:
                  building.areas.filter(
                    a =>
                      a.id !== areaId
                  )
              }
            : building
      ),

      records: prev.records.filter(
        r => r.areaId !== areaId
      )
    }));

    setSelectedAreaId(null);
    setScreen("building");
  }

  function addRecord(record) {
    setData(prev => ({
      ...prev,

      records: [
        ...prev.records,
        record
      ]
    }));
  }

  function updateRecord(record) {
    setData(prev => ({
      ...prev,

      records: prev.records.map(
        r =>
          r.id === record.id
            ? record
            : r
      )
    }));
  }

  function deleteRecord(id) {
    if (
      !confirm(
        "Excluir este registro?"
      )
    ) {
      return;
    }

    setData(prev => ({
      ...prev,

      records: prev.records.filter(
        r => r.id !== id
      )
    }));
  }

  function exportJSON() {
    const blob = new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      `controle-panos-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

    a.click();

    URL.revokeObjectURL(url);
  }

  function importJSON(event) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = e => {
      try {
        const imported =
          JSON.parse(
            e.target.result
          );

        if (
          !Array.isArray(
            imported.buildings
          ) ||
          !Array.isArray(
            imported.records
          )
        ) {
          throw new Error(
            "Formato inválido"
          );
        }

        if (
          !confirm(
            "Importar este arquivo substituirá os dados atuais. Continuar?"
          )
        ) {
          return;
        }

        setData({
          buildings:
            imported.buildings,
          records:
            imported.records
        });

        alert(
          "Dados importados com sucesso."
        );
      } catch {
        alert(
          "O arquivo JSON é inválido."
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  function createPDF(buildingId = null) {
    const pdf = new jsPDF();

    const buildings = buildingId
      ? data.buildings.filter(
          b => b.id === buildingId
        )
      : data.buildings;

    let y = 18;

    pdf.setFontSize(18);

    pdf.text(
      "Relatório - Controle de Panos",
      14,
      y
    );

    y += 8;

    pdf.setFontSize(9);

    pdf.text(
      `Gerado em ${new Date().toLocaleString(
        "pt-BR"
      )}`,
      14,
      y
    );

    y += 10;

    buildings.forEach(
      building => {
        if (y > 250) {
          pdf.addPage();
          y = 18;
        }

        pdf.setFontSize(14);

        pdf.text(
          `PRÉDIO ${building.number}`,
          14,
          y
        );

        y += 8;

        building.areas?.forEach(
          area => {
            if (y > 250) {
              pdf.addPage();
              y = 18;
            }

            pdf.setFontSize(11);

            pdf.text(
              `Área: ${area.name}`,
              18,
              y
            );

            y += 6;

            pdf.setFontSize(9);

            area.clothTypes?.forEach(
              clothType => {
                const records =
                  data.records
                    .filter(
                      r =>
                        r.buildingId ===
                          building.id &&
                        r.areaId ===
                          area.id &&
                        r.clothType ===
                          clothType
                    )
                    .sort(
                      (a, b) =>
                        String(
                          b.date
                        ).localeCompare(
                          String(
                            a.date
                          )
                        )
                    );

                pdf.text(
                  `Tipo de pano: ${clothType}`,
                  22,
                  y
                );

                y += 5;

                if (
                  !records.length
                ) {
                  pdf.text(
                    "Nenhum registro.",
                    26,
                    y
                  );

                  y += 6;

                  return;
                }

                records.forEach(
                  record => {
                    if (y > 270) {
                      pdf.addPage();
                      y = 18;
                    }

                    const missing =
                      Math.max(
                        0,
                        Number(
                          record.total
                        ) -
                          Number(
                            record.collected
                          )
                      );

                    pdf.text(
                      `${record.date} | Total: ${record.total} | Recolhidos: ${record.collected} | Sujos: ${record.dirty} | Limpos: ${record.clean} | Faltam: ${missing}`,
                      26,
                      y
                    );

                    y += 5;

                    pdf.text(
                      `Resp. prédio: ${
                        record.responsibleBuilding ||
                        "-"
                      } | Registro: ${
                        record.responsibleEntry ||
                        "-"
                      }`,
                      30,
                      y
                    );

                    y += 6;

                    if (
                      record.signature
                    ) {
                      pdf.text(
                        "Assinatura digital registrada.",
                        30,
                        y
                      );

                      y += 5;
                    }
                  }
                );

                y += 3;
              }
            );

            y += 4;
          }
        );

        y += 5;
      }
    );

    pdf.save(
      buildingId
        ? `relatorio-predio-${
            buildings[0]?.number ||
            "selecionado"
          }.pdf`
        : `relatorio-geral-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`
    );
  }

  function openNewRecord() {
    if (
      selectedBuilding &&
      selectedArea
    ) {
      setEditingRecord(null);
      setShowRecordForm(true);
      return;
    }

    alert(
      "Entre em um prédio e depois em uma área para adicionar um pano."
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <button
          className="icon-btn"
          onClick={() =>
            setMenuOpen(
              value => !value
            )
          }
          aria-label="Menu"
        >
          {menuOpen ? (
            <X />
          ) : (
            <Menu />
          )}
        </button>

        <div className="brand">
          <Package size={22} />

          <span>
            Controle de Panos
          </span>
        </div>

        <div className="top-actions">

          <button
            className="secondary"
            onClick={
              exportJSON
            }
          >
            <Download
              size={17}
            />

            <span>
              Exportar
            </span>
          </button>

          <label className="secondary file-label">

            <Upload size={17} />

            <span>
              Importar
            </span>

            <input
              type="file"
              accept=".json,application/json"
              onChange={
                importJSON
              }
              hidden
            />

          </label>

        </div>

      </header>

      {menuOpen && (
        <div
          className="backdrop"
          onClick={() =>
            setMenuOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          menuOpen
            ? "open"
            : ""
        }`}
      >

        <div className="sidebar-head">

          <strong>
            Navegação
          </strong>

          <button
            className="icon-btn small"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <X />
          </button>

        </div>

        <button
          className="side-link"
          onClick={
            goHome
          }
        >
          <Home size={18} />
          Dashboard
        </button>

        <button
          className="side-link add"
          onClick={() => {
            setShowBuildingForm(
              true
            );

            setMenuOpen(false);
          }}
        >
          <Plus size={18} />
          Adicionar prédio
        </button>

        <button
          className="side-link"
          onClick={
            openActions
          }
        >
          <Settings size={18} />
          Central de ações
        </button>

        <div className="sidebar-divider" />

        <div className="sidebar-label">
          Prédios
        </div>

        <div className="building-list">

          {data.buildings.map(
            building => (
              <button
                key={
                  building.id
                }
                className={`building-link ${
                  selectedBuildingId ===
                  building.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  openBuilding(
                    building.id
                  )
                }
              >
                <span>
                  <b>
                    Prédio{" "}
                    {
                      building.number
                    }
                  </b>

                  <small>
                    {
                      building
                        .areas
                        ?.length ||
                      0
                    } área(s)
                  </small>
                </span>

                <ChevronRight
                  size={16}
                />
              </button>
            )
          )}

          {!data.buildings
            .length && (
            <p className="empty-side">
              Nenhum prédio
              cadastrado.
            </p>
          )}

        </div>

      </aside>

      <main className="content">

        {screen !==
          "actions" && (
          <div className="page-head">

            <div>

              {screen !==
                "dashboard" && (
                <button
                  className="back-button"
                  onClick={() => {
                    if (
                      screen ===
                      "area"
                    ) {
                      setScreen(
                        "building"
                      );
                      setSelectedAreaId(
                        null
                      );
                    } else {
                      goHome();
                    }
                  }}
                >
                  <ArrowLeft
                    size={16}
                  />
                  Voltar
                </button>
              )}

              <div
                className="breadcrumb"
                onClick={
                  goHome
                }
              >
                Início
              </div>

              <h1>
                {screen ===
                  "building" &&
                selectedBuilding
                  ? `Prédio ${selectedBuilding.number}`
                  : screen ===
                      "area" &&
                    selectedBuilding &&
                    selectedArea
                  ? `Prédio ${selectedBuilding.number} — ${selectedArea.name}`
                  : "Dashboard"}
              </h1>

            </div>

            <div className="head-buttons">

              {screen ===
                "building" &&
                selectedBuilding && (
                  <button
                    className="primary"
                    onClick={() =>
                      setShowAreaForm(
                        true
                      )
                    }
                  >
                    <Plus
                      size={18}
                    />
                    Nova área
                  </button>
                )}

              {screen ===
                "area" &&
                selectedArea && (
                  <button
                    className="primary"
                    onClick={() => {
                      setEditingRecord(
                        null
                      );

                      setShowRecordForm(
                        true
                      );
                    }}
                  >
                    <Plus
                      size={18}
                    />
                    Adicionar pano
                  </button>
                )}

              <button
                className="secondary pdf-button"
                onClick={() =>
                  createPDF(
                    selectedBuildingId ||
                      null
                  )
                }
              >
                <FileText
                  size={17}
                />

                PDF
              </button>

            </div>

          </div>
        )}

        {screen ===
          "dashboard" && (
          <>
            <div className="searchbar">

              <Search
                size={19}
              />

              <input
                value={search}
                onChange={e =>
                  setSearch(
                    e.target
                      .value
                  )
                }
                placeholder="Pesquisar prédio, área ou tipo de pano..."
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch(
                      ""
                    )
                  }
                >
                  <X
                    size={17}
                  />
                </button>
              )}

            </div>

            <Dashboard
              data={data}
              buildings={
                filteredBuildings
              }
              onOpen={
                openBuilding
              }
              onDelete={
                deleteBuilding
              }
              onAdd={() =>
                setShowBuildingForm(
                  true
                )
              }
            />
          </>
        )}

        {screen ===
          "actions" && (
          <ActionsPage
            data={data}
            onHome={
              goHome
            }
            onAddBuilding={() => {
              setShowBuildingForm(
                true
              );
            }}
            onOpenBuilding={
              openBuilding
            }
            onAddRecord={
              openNewRecord
            }
          />
        )}

        {screen ===
          "building" &&
          selectedBuilding && (
            <BuildingPage
              building={
                selectedBuilding
              }
              records={
                data.records
              }
              onOpenArea={areaId =>
                openArea(
                  selectedBuilding.id,
                  areaId
                )
              }
              onAddArea={() =>
                setShowAreaForm(
                  true
                )
              }
              onDeleteBuilding={() =>
                deleteBuilding(
                  selectedBuilding.id
                )
              }
            />
          )}

        {screen ===
          "area" &&
          selectedBuilding &&
          selectedArea && (
            <AreaPage
              building={
                selectedBuilding
              }
              area={
                selectedArea
              }
              records={
                data.records
              }
              onAdd={() => {
                setEditingRecord(
                  null
                );

                setShowRecordForm(
                  true
                );
              }}
              onEdit={record => {
                setEditingRecord(
                  record
                );

                setShowRecordForm(
                  true
                );
              }}
              onDelete={
                deleteRecord
              }
              onEditArea={() => {
                setEditingArea(
                  selectedArea
                );

                setShowAreaForm(
                  true
                );
              }}
              onDeleteArea={() =>
                deleteArea(
                  selectedArea.id
                )
              }
            />
          )}

      </main>

      <nav className="bottom-nav">

        <button
          className={
            screen ===
            "dashboard"
              ? "active"
              : ""
          }
          onClick={
            goHome
          }
        >
          <Home
            size={22}
          />

          <span>
            Início
          </span>
        </button>

        <button
          className="bottom-add"
          onClick={
            openActions
          }
          aria-label="Adicionar"
        >
          <Plus
            size={27}
          />
        </button>

        <button
          className={
            screen ===
            "actions"
              ? "active"
              : ""
          }
          onClick={
            openActions
          }
        >
          <Settings
            size={22}
          />

          <span>
            Ações
          </span>
        </button>

      </nav>

      {showBuildingForm && (
        <BuildingModal
          onClose={() =>
            setShowBuildingForm(
              false
            )
          }
          onSave={number => {
            addBuilding(
              number
            );

            setShowBuildingForm(
              false
            );
          }}
        />
      )}

      {showAreaForm &&
        selectedBuilding && (
          <AreaModal
            building={
              selectedBuilding
            }
            area={
              editingArea
            }
            onClose={() => {
              setShowAreaForm(
                false
              );

              setEditingArea(
                null
              );
            }}
            onSave={area => {
              if (
                editingArea
              ) {
                updateArea(
                  area
                );
              } else {
                addArea(
                  area
                );
              }

              setShowAreaForm(
                false
              );

              setEditingArea(
                null
              );
            }}
          />
        )}

      {showRecordForm &&
        selectedBuilding &&
        selectedArea && (
          <RecordModal
            building={
              selectedBuilding
            }
            area={
              selectedArea
            }
            record={
              editingRecord
            }
            onClose={() => {
              setShowRecordForm(
                false
              );

              setEditingRecord(
                null
              );
            }}
            onSave={record => {
              if (
                editingRecord
              ) {
                updateRecord(
                  record
                );
              } else {
                addRecord(
                  record
                );
              }

              setShowRecordForm(
                false
              );

              setEditingRecord(
                null
              );
            }}
          />
        )}

    </div>
  );
}

/* =========================
   ACTIONS PAGE
========================= */

function ActionsPage({
  data,
  onHome,
  onAddBuilding,
  onOpenBuilding,
  onAddRecord
}) {
  return (
    <section className="actions-page">

      <div className="actions-header">

        <button
          className="back-button"
          onClick={onHome}
        >
          <ArrowLeft
            size={17}
          />
          Voltar
        </button>

        <span className="action-kicker">
          CENTRAL
        </span>

        <h1>
          O que você deseja fazer?
        </h1>

        <p>
          Acesse rapidamente as
          principais funções do
          aplicativo.
        </p>

      </div>

      <div className="action-grid">

        <ActionCard
          icon={<Building2 />}
          title="Adicionar prédio"
          description="Cadastre um novo prédio no controle."
          onClick={
            onAddBuilding
          }
          primary
        />

        <ActionCard
          icon={<ClipboardList />}
          title="Abrir um prédio"
          description="Entre em um prédio para editar áreas e registros."
          onClick={() => {
            if (
              data.buildings.length
            ) {
              onOpenBuilding(
                data
                  .buildings[0]
                  .id
              );
            } else {
              alert(
                "Nenhum prédio cadastrado."
              );
            }
          }}
        />

        <ActionCard
          icon={<PenLine />}
          title="Adicionar pano"
          description="Registre a quantidade de panos de uma área."
          onClick={
            onAddRecord
          }
        />

      </div>

      <div className="action-tip">
        <Plus size={19} />

        <div>
          <strong>
            Dica
          </strong>

          <span>
            No celular, use o botão
            + na barra inferior para
            acessar estas ações.
          </span>
        </div>
      </div>

    </section>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  primary = false
}) {
  return (
    <button
      className={`action-card ${
        primary
          ? "primary-action"
          : ""
      }`}
      onClick={
        onClick
      }
    >
      <div className="action-card-icon">
        {icon}
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </div>

      <ChevronRight
        className="action-arrow"
        size={20}
      />
    </button>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard({
  data,
  buildings,
  onOpen,
  onDelete,
  onAdd
}) {
  const totalRecords =
    data.records.length;

  const missing =
    data.records.reduce(
      (sum, r) =>
        sum +
        Math.max(
          0,
          Number(
            r.total
          ) -
            Number(
              r.collected
            )
        ),
      0
    );

  const dirty =
    data.records.reduce(
      (sum, r) =>
        sum +
        Number(
          r.dirty || 0
        ),
      0
    );

  const clean =
    data.records.reduce(
      (sum, r) =>
        sum +
        Number(
          r.clean || 0
        ),
      0
    );

  const totalAreas =
    data.buildings.reduce(
      (sum, b) =>
        sum +
        (b.areas
          ?.length || 0),
      0
    );

  return (
    <>
      <div className="mobile-dashboard-intro">
        <span>
          CONTROLE
        </span>

        <h2>
          Visão geral
        </h2>

        <p>
          Acompanhe seus prédios,
          áreas e registros.
        </p>
      </div>

      <div className="stats">

        <Stat
          title="Prédios"
          value={
            data.buildings
              .length
          }
          icon={
            <Building2 />
          }
        />

        <Stat
          title="Áreas"
          value={
            totalAreas
          }
          icon={
            <Layers />
          }
        />

        <Stat
          title="Registros"
          value={
            totalRecords
          }
          icon={
            <RefreshCw />
          }
        />

        <Stat
          title="Panos faltando"
          value={
            missing
          }
          icon={
            <AlertTriangle />
          }
        />

        <Stat
          title="Panos sujos"
          value={
            dirty
          }
          icon={
            <Package />
          }
        />

      </div>

      <section className="section">

        <div className="section-title">

          <div>
            <h2>
              Prédios
            </h2>

            <p>
              Selecione um prédio
              para acessar as
              áreas.
            </p>
          </div>

          <button
            className="primary desktop-action"
            onClick={
              onAdd
            }
          >
            <Plus
              size={18}
            />
            Adicionar prédio
          </button>

        </div>

        <div className="cards">

          {buildings.map(
            building => (
              <BuildingCard
                key={
                  building.id
                }
                building={
                  building
                }
                onOpen={() =>
                  onOpen(
                    building.id
                  )
                }
                onDelete={() =>
                  onDelete(
                    building.id
                  )
                }
              />
            )
          )}

          {!buildings.length && (
            <div className="empty-card">

              <Building2
                size={42}
              />

              <h3>
                Nenhum prédio
                cadastrado
              </h3>

              <p>
                Cadastre o primeiro
                prédio para começar.
              </p>

              <button
                className="primary"
                onClick={
                  onAdd
                }
              >
                <Plus
                  size={18}
                />
                Cadastrar prédio
              </button>

            </div>
          )}

        </div>

      </section>
    </>
  );
}

/* =========================
   BUILDING PAGE
========================= */

function BuildingPage({
  building,
  records,
  onOpenArea,
  onAddArea,
  onDeleteBuilding
}) {
  return (
    <>
      <div className="building-banner">

        <div>
          <span className="tag">
            Prédio{" "}
            {
              building.number
            }
          </span>

          <p>
            {
              building
                .areas
                ?.length ||
              0
            }{" "}
            área(s)
            cadastrada(s)
          </p>
        </div>

        <div className="row-actions">

          <button
            className="primary"
            onClick={
              onAddArea
            }
          >
            <Plus
              size={17}
            />
            Adicionar área
          </button>

          <button
            className="danger"
            onClick={
              onDeleteBuilding
            }
          >
            <Trash2
              size={17}
            />
            Excluir prédio
          </button>

        </div>

      </div>

      <section className="section">

        <div className="section-title">

          <div>
            <h2>
              Áreas do prédio
            </h2>

            <p>
              Cada área pode ter
              um ou vários tipos
              de pano.
            </p>
          </div>

        </div>

        <div className="cards">

          {building.areas?.map(
            area => (
              <AreaCard
                key={
                  area.id
                }
                area={
                  area
                }
                records={
                  records.filter(
                    r =>
                      r.buildingId ===
                        building.id &&
                      r.areaId ===
                        area.id
                  )
                }
                onOpen={() =>
                  onOpenArea(
                    area.id
                  )
                }
              />
            )
          )}

          {!building.areas
            ?.length && (
            <div className="empty-card">

              <Layers
                size={42}
              />

              <h3>
                Nenhuma área
                cadastrada
              </h3>

              <p>
                Adicione uma área
                para este prédio.
              </p>

              <button
                className="primary"
                onClick={
                  onAddArea
                }
              >
                <Plus
                  size={18}
                />
                Adicionar área
              </button>

            </div>
          )}

        </div>

      </section>
    </>
  );
}

/* =========================
   AREA PAGE
========================= */

function AreaPage({
  building,
  area,
  records,
  onAdd,
  onEdit,
  onDelete,
  onEditArea,
  onDeleteArea
}) {
  const areaRecords =
    records.filter(
      r =>
        r.buildingId ===
          building.id &&
        r.areaId ===
          area.id
    );

  const totals =
    areaRecords.reduce(
      (acc, r) => ({
        total:
          acc.total +
          Number(
            r.total || 0
          ),

        collected:
          acc.collected +
          Number(
            r.collected ||
              0
          ),

        dirty:
          acc.dirty +
          Number(
            r.dirty || 0
          ),

        clean:
          acc.clean +
          Number(
            r.clean || 0
          )
      }),
      {
        total: 0,
        collected: 0,
        dirty: 0,
        clean: 0
      }
    );

  const missing =
    Math.max(
      0,
      totals.total -
        totals.collected
    );

  return (
    <>
      <div className="building-banner">

        <div>
          <span className="tag">
            Prédio{" "}
            {
              building.number
            }
          </span>

          <p>
            Área:{" "}
            <b>
              {area.name}
            </b>
          </p>

          <p>
            Tipos de pano:{" "}
            <b>
              {area.clothTypes?.join(
                " / "
              )}
            </b>
          </p>
        </div>

        <div className="row-actions">

          <button
            className="secondary"
            onClick={
              onEditArea
            }
          >
            <Edit3
              size={17}
            />
            Editar área
          </button>

          <button
            className="danger"
            onClick={
              onDeleteArea
            }
          >
            <Trash2
              size={17}
            />
            Excluir área
          </button>

        </div>

      </div>

      <div className="stats compact">

        <Stat
          title="Total informado"
          value={
            totals.total
          }
          icon={
            <Package />
          }
        />

        <Stat
          title="Recolhidos"
          value={
            totals.collected
          }
          icon={
            <RefreshCw />
          }
        />

        <Stat
          title="Faltando"
          value={
            missing
          }
          icon={
            <AlertTriangle />
          }
        />

        <Stat
          title="Sujos"
          value={
            totals.dirty
          }
          icon={
            <Package />
          }
        />

        <Stat
          title="Limpos"
          value={
            totals.clean
          }
          icon={
            <Package />
          }
        />

      </div>

      <section className="section">

        <div className="section-title">

          <div>
            <h2>
              Registros da área
            </h2>

            <p>
              {
                areaRecords.length
              }{" "}
              registro(s)
            </p>
          </div>

          <button
            className="primary"
            onClick={
              onAdd
            }
          >
            <Plus
              size={18}
            />
            Adicionar pano
          </button>

        </div>

        <RecordsTable
          records={
            areaRecords
          }
          building={
            building
          }
          area={area}
          onEdit={
            onEdit
          }
          onDelete={
            onDelete
          }
        />

      </section>
    </>
  );
}

/* =========================
   CARDS
========================= */

function BuildingCard({
  building,
  onOpen,
  onDelete
}) {
  return (
    <div className="card">

      <button
        className="card-main"
        onClick={
          onOpen
        }
      >
        <div className="card-icon">
          <Building2 />
        </div>

        <div className="card-info">

          <b>
            Prédio{" "}
            {
              building.number
            }
          </b>

          <span>
            {
              building
                .areas
                ?.length ||
              0
            }{" "}
            área(s)
          </span>

        </div>

        <ChevronRight />

      </button>

      <div className="card-bottom">

        <span>
          {
            building
              .areas
              ?.length ||
            0
          }{" "}
          área(s)
          cadastrada(s)
        </span>

        <div className="row-actions">

          <button
            title="Excluir prédio"
            onClick={
              onDelete
            }
          >
            <Trash2
              size={16}
            />
          </button>

        </div>

      </div>

    </div>
  );
}

function AreaCard({
  area,
  records,
  onOpen
}) {
  const missing =
    records.reduce(
      (sum, r) =>
        sum +
        Math.max(
          0,
          Number(
            r.total
          ) -
            Number(
              r.collected
            )
        ),
      0
    );

  return (
    <div className="card">

      <button
        className="card-main"
        onClick={
          onOpen
        }
      >

        <div className="card-icon">
          <Layers />
        </div>

        <div className="card-info">

          <b>
            {area.name}
          </b>

          <span>
            {
              area
                .clothTypes
                ?.length ||
              0
            }{" "}
            tipo(s) de pano
          </span>

          <small>
            {area.clothTypes?.join(
              " • "
            )}
          </small>

        </div>

        <ChevronRight />

      </button>

      <div className="card-bottom">

        <span>
          Faltantes:{" "}
          <b>
            {missing}
          </b>
        </span>

      </div>

    </div>
  );
}

function Stat({
  title,
  value,
  icon
}) {
  return (
    <div className="stat">

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>

    </div>
  );
}

/* =========================
   RECORD TABLE
========================= */

function RecordsTable({
  records,
  building,
  area,
  onEdit,
  onDelete
}) {
  if (!records.length) {
    return (
      <div className="empty-table">

        <Package
          size={34}
        />

        <strong>
          Nenhum registro
          encontrado.
        </strong>

        <span>
          Adicione o primeiro
          registro desta área.
        </span>

      </div>
    );
  }

  const sorted =
    [...records].sort(
      (a, b) =>
        String(
          b.date
        ).localeCompare(
          String(a.date)
        )
    );

  return (
    <div className="table-wrap">

      <table>

        <thead>
          <tr>
            <th>
              Data
            </th>

            <th>
              Tipo
            </th>

            <th>
              Total
            </th>

            <th>
              Recolhidos
            </th>

            <th>
              Sujos
            </th>

            <th>
              Limpos
            </th>

            <th>
              Faltam
            </th>

            <th>
              Responsável
            </th>

            <th>
              Assinatura
            </th>

            <th>
              Ações
            </th>
          </tr>
        </thead>

        <tbody>

          {sorted.map(
            record => {
              const missing =
                Math.max(
                  0,
                  Number(
                    record.total
                  ) -
                    Number(
                      record.collected
                    )
                );

              return (
                <tr
                  key={
                    record.id
                  }
                >

                  <td>
                    {
                      record.date
                    }
                  </td>

                  <td>
                    {
                      record.clothType
                    }
                  </td>

                  <td>
                    {
                      record.total
                    }
                  </td>

                  <td>
                    {
                      record.collected
                    }
                  </td>

                  <td>
                    {
                      record.dirty
                    }
                  </td>

                  <td>
                    {
                      record.clean
                    }
                  </td>

                  <td>
                    <span
                      className={
                        missing
                          ? "missing"
                          : "ok"
                      }
                    >
                      {
                        missing
                      }
                    </span>
                  </td>

                  <td>
                    {
                      record.responsibleEntry ||
                      "-"
                    }
                  </td>

                  <td>
                    {record.signature ? (
                      <span className="signature-status">
                        <PenLine
                          size={14}
                        />
                        Assinado
                      </span>
                    ) : (
                      <span className="no-signature">
                        Sem assinatura
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="row-actions">

                      <button
                        title="Editar"
                        onClick={() =>
                          onEdit(
                            record
                          )
                        }
                      >
                        <Edit3
                          size={15}
                        />
                      </button>

                      <button
                        title="Excluir"
                        onClick={() =>
                          onDelete(
                            record.id
                          )
                        }
                      >
                        <Trash2
                          size={15}
                        />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}

/* =========================
   BUILDING MODAL
========================= */

function BuildingModal({
  onClose,
  onSave
}) {
  const [number, setNumber] =
    useState("");

  function submit(e) {
    e.preventDefault();

    if (!number.trim()) {
      alert(
        "Informe o número do prédio."
      );

      return;
    }

    onSave(number);
  }

  return (
    <Modal
      title="Adicionar prédio"
      onClose={
        onClose
      }
    >
      <form
        onSubmit={
          submit
        }
      >

        <label>
          Número do prédio

          <input
            value={
              number
            }
            onChange={e =>
              setNumber(
                e.target
                  .value
              )
            }
            placeholder="Ex.: 21"
            autoFocus
          />
        </label>

        <p className="hint">
          Depois de criar o prédio,
          você poderá adicionar
          quantas áreas quiser
          dentro dele.
        </p>

        <ModalButtons
          onClose={
            onClose
          }
          text="Criar prédio"
        />

      </form>
    </Modal>
  );
}

/* =========================
   AREA MODAL
========================= */

function AreaModal({
  building,
  area,
  onClose,
  onSave
}) {
  const [name, setName] =
    useState(
      area?.name || ""
    );

  const [
    clothTypes,
    setClothTypes
  ] = useState(
    area?.clothTypes
      ?.length
      ? area.clothTypes
      : [""]
  );

  function updateType(
    index,
    value
  ) {
    setClothTypes(
      prev =>
        prev.map(
          (type, i) =>
            i === index
              ? value
              : type
        )
    );
  }

  function addType() {
    setClothTypes(
      prev => [
        ...prev,
        ""
      ]
    );
  }

  function removeType(
    index
  ) {
    setClothTypes(
      prev =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    );
  }

  function submit(e) {
    e.preventDefault();

    const cleanTypes =
      clothTypes
        .map(t =>
          t.trim()
        )
        .filter(Boolean);

    if (!name.trim()) {
      alert(
        "Informe o nome da área."
      );

      return;
    }

    if (
      !cleanTypes.length
    ) {
      alert(
        "Informe pelo menos um tipo de pano."
      );

      return;
    }

    onSave({
      id:
        area?.id ||
        crypto.randomUUID(),

      name:
        name.trim(),

      clothTypes: [
        ...new Set(
          cleanTypes
        )
      ],

      createdAt:
        area?.createdAt ||
        new Date().toISOString()
    });
  }

  return (
    <Modal
      title={
        area
          ? "Editar área"
          : `Adicionar área — Prédio ${building.number}`
      }
      onClose={
        onClose
      }
    >

      <form
        onSubmit={
          submit
        }
      >

        <label>
          Nome da área

          <input
            value={
              name
            }
            onChange={e =>
              setName(
                e.target
                  .value
              )
            }
            placeholder="Ex.: Ferramentaria"
            autoFocus
          />
        </label>

        <div>

          <div className="type-header">

            <label>
              Tipos de pano
            </label>

            <button
              type="button"
              className="secondary"
              onClick={
                addType
              }
            >
              <Plus
                size={15}
              />
              Adicionar tipo
            </button>

          </div>

          <div className="type-list">

            {clothTypes.map(
              (
                type,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="type-row"
                >

                  <input
                    value={
                      type
                    }
                    onChange={e =>
                      updateType(
                        index,
                        e.target
                          .value
                      )
                    }
                    placeholder={
                      index ===
                      0
                        ? "Ex.: Surface"
                        : "Ex.: Microfibra"
                    }
                  />

                  {clothTypes.length >
                    1 && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        removeType(
                          index
                        )
                      }
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </button>
                  )}

                </div>
              )
            )}

          </div>

        </div>

        <p className="hint">
          Uma área pode usar vários
          tipos. Ex.:{" "}
          <b>
            Surface
          </b>{" "}
          +{" "}
          <b>
            Microfibra
          </b>
          .
        </p>

        <ModalButtons
          onClose={
            onClose
          }
          text={
            area
              ? "Salvar área"
              : "Criar área"
          }
        />

      </form>

    </Modal>
  );
}

/* =========================
   RECORD MODAL
========================= */

function RecordModal({
  building,
  area,
  record,
  onClose,
  onSave
}) {
  const [date, setDate] =
    useState(
      record?.date ||
        new Date()
          .toISOString()
          .slice(0, 10)
    );

  const [
    clothType,
    setClothType
  ] = useState(
    record?.clothType ||
      area.clothTypes?.[0] ||
      ""
  );

  const [total, setTotal] =
    useState(
      record?.total ??
        ""
    );

  const [
    collected,
    setCollected
  ] = useState(
    record?.collected ??
      ""
  );

  const [dirty, setDirty] =
    useState(
      record?.dirty ??
        ""
    );

  const [clean, setClean] =
    useState(
      record?.clean ??
        ""
    );

  const [
    responsibleBuilding,
    setResponsibleBuilding
  ] = useState(
    record?.responsibleBuilding ||
      ""
  );

  const [
    responsibleEntry,
    setResponsibleEntry
  ] = useState(
    record?.responsibleEntry ||
      ""
  );

  const [
    signature,
    setSignature
  ] = useState(
    record?.signature ||
      ""
  );

  function submit(e) {
    e.preventDefault();

    if (
      !date ||
      !clothType ||
      total === "" ||
      collected === "" ||
      dirty === "" ||
      clean === "" ||
      !responsibleBuilding.trim() ||
      !responsibleEntry.trim()
    ) {
      alert(
        "Preencha todos os campos."
      );

      return;
    }

    const values = [
      Number(total),
      Number(collected),
      Number(dirty),
      Number(clean)
    ];

    if (
      values.some(
        value => value < 0
      )
    ) {
      alert(
        "As quantidades não podem ser negativas."
      );

      return;
    }

    if (!signature) {
      const confirmWithoutSignature =
        confirm(
          "Nenhuma assinatura foi registrada. Deseja salvar mesmo assim?"
        );

      if (
        !confirmWithoutSignature
      ) {
        return;
      }
    }

    onSave({
      id:
        record?.id ||
        crypto.randomUUID(),

      buildingId:
        building.id,

      areaId:
        area.id,

      clothType,

      date,

      total:
        Number(total),

      collected:
        Number(collected),

      dirty:
        Number(dirty),

      clean:
        Number(clean),

      responsibleBuilding:
        responsibleBuilding.trim(),

      responsibleEntry:
        responsibleEntry.trim(),

      signature:
        signature || null,

      updatedAt:
        new Date().toISOString()
    });
  }

  const missing =
    Math.max(
      0,
      Number(total || 0) -
        Number(
          collected || 0
        )
    );

  return (
    <Modal
      title={
        record
          ? "Editar registro"
          : "Adicionar pano do dia"
      }
      onClose={
        onClose
      }
    >

      <div className="record-context">

        <b>
          Prédio{" "}
          {
            building.number
          }
        </b>

        <span>
          Área:{" "}
          {area.name}
        </span>

        <span>
          Tipos:{" "}
          {area.clothTypes.join(
            " / "
          )}
        </span>

      </div>

      <form
        onSubmit={
          submit
        }
      >

        <label>
          Tipo de pano

          <select
            value={
              clothType
            }
            onChange={e =>
              setClothType(
                e.target
                  .value
              )
            }
          >
            {area.clothTypes.map(
              type => (
                <option
                  key={
                    type
                  }
                  value={
                    type
                  }
                >
                  {type}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          Data

          <input
            type="date"
            value={
              date
            }
            onChange={e =>
              setDate(
                e.target
                  .value
              )
            }
          />
        </label>

        <div className="form-grid">

          <label>
            Quantidade total

            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={
                total
              }
              onChange={e =>
                setTotal(
                  e.target
                    .value
                )
              }
            />
          </label>

          <label>
            Quantidade recolhida

            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={
                collected
              }
              onChange={e =>
                setCollected(
                  e.target
                    .value
                )
              }
            />
          </label>

          <label>
            Quantidade suja

            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={
                dirty
              }
              onChange={e =>
                setDirty(
                  e.target
                    .value
                )
              }
            />
          </label>

          <label>
            Quantidade limpa

            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={
                clean
              }
              onChange={e =>
                setClean(
                  e.target
                    .value
                )
              }
            />
          </label>

        </div>

        <div
          className={`calculation ${
            missing
              ? "warning"
              : "success"
          }`}
        >
          Quantidade faltando:{" "}
          <strong>
            {missing}
          </strong>
        </div>

        <label>
          Responsável pelo prédio

          <input
            value={
              responsibleBuilding
            }
            onChange={e =>
              setResponsibleBuilding(
                e.target
                  .value
              )
            }
            placeholder="Nome do responsável"
          />
        </label>

        <label>
          Responsável pelo registro

          <input
            value={
              responsibleEntry
            }
            onChange={e =>
              setResponsibleEntry(
                e.target
                  .value
              )
            }
            placeholder="Nome de quem está anotando"
          />
        </label>

        {/* ASSINATURA */}
        <SignaturePad
          value={
            signature
          }
          onChange={
            setSignature
          }
        />

        <ModalButtons
          onClose={
            onClose
          }
          text={
            record
              ? "Salvar registro"
              : "Salvar registro"
          }
        />

      </form>

    </Modal>
  );
}

/* =========================
   ASSINATURA
========================= */

function SignaturePad({
  value,
  onChange
}) {
  const canvasRef =
    useRef(null);

  const drawingRef =
    useRef(false);

  const lastPointRef =
    useRef({
      x: 0,
      y: 0
    });

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext(
        "2d"
      );

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (value) {
      const image =
        new Image();

      image.onload =
        () => {
          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );
        };

      image.src =
        value;
    }
  }, [value]);

  function prepareCanvas() {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const ratio =
      Math.max(
        window.devicePixelRatio ||
          1,
        1
      );

    const width =
      Math.max(
        Math.floor(
          rect.width *
            ratio
        ),
        1
      );

    const height =
      Math.max(
        Math.floor(
          rect.height *
            ratio
        ),
        1
      );

    if (
      canvas.width !==
        width ||
      canvas.height !==
        height
    ) {
      const old =
        value;

      canvas.width =
        width;

      canvas.height =
        height;

      const context =
        canvas.getContext(
          "2d"
        );

      context.scale(
        ratio,
        ratio
      );

      if (old) {
        const image =
          new Image();

        image.onload =
          () => {
            context.drawImage(
              image,
              0,
              0,
              rect.width,
              rect.height
            );
          };

        image.src =
          old;
      }
    }
  }

  useEffect(() => {
    prepareCanvas();

    const handleResize =
      () => {
        prepareCanvas();
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  function getPoint(
    event
  ) {
    const canvas =
      canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top
    };
  }

  function startDrawing(
    event
  ) {
    event.preventDefault();

    prepareCanvas();

    const canvas =
      canvasRef.current;

    if (
      canvas?.setPointerCapture
    ) {
      try {
        canvas.setPointerCapture(
          event.pointerId
        );
      } catch {
        // Ignora caso o navegador não suporte.
      }
    }

    const point =
      getPoint(event);

    drawingRef.current =
      true;

    lastPointRef.current =
      point;
  }

  function draw(event) {
    if (
      !drawingRef.current
    ) {
      return;
    }

    event.preventDefault();

    const canvas =
      canvasRef.current;

    const context =
      canvas.getContext(
        "2d"
      );

    const point =
      getPoint(event);

    context.beginPath();

    context.moveTo(
      lastPointRef.current.x,
      lastPointRef.current.y
    );

    context.lineTo(
      point.x,
      point.y
    );

    context.strokeStyle =
      "#111827";

    context.lineWidth =
      2.2;

    context.lineCap =
      "round";

    context.lineJoin =
      "round";

    context.stroke();

    lastPointRef.current =
      point;
  }

  function stopDrawing(
    event
  ) {
    if (
      !drawingRef.current
    ) {
      return;
    }

    drawingRef.current =
      false;

    if (
      canvasRef.current?.releasePointerCapture
    ) {
      try {
        canvasRef.current.releasePointerCapture(
          event.pointerId
        );
      } catch {
        // Ignora.
      }
    }

    saveCanvas();
  }

  function saveCanvas() {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const dataUrl =
      canvas.toDataURL(
        "image/png"
      );

    onChange(
      dataUrl
    );
  }

  function clearSignature() {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext(
        "2d"
      );

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    onChange("");
  }

  return (
    <div className="signature-section">

      <div className="signature-title">

        <div>
          <label>
            Assinatura
          </label>

          <span>
            Assine abaixo com o
            dedo
          </span>
        </div>

        <button
          type="button"
          className="signature-clear"
          onClick={
            clearSignature
          }
        >
          <Eraser
            size={15}
          />
          Limpar
        </button>

      </div>

      <div className="signature-box">

        <canvas
          ref={
            canvasRef
          }
          onPointerDown={
            startDrawing
          }
          onPointerMove={
            draw
          }
          onPointerUp={
            stopDrawing
          }
          onPointerCancel={
            stopDrawing
          }
          onPointerLeave={
            stopDrawing
          }
        />

        {!value && (
          <div className="signature-placeholder">
            <PenLine
              size={22}
            />

            <span>
              Desenhe sua
              assinatura aqui
            </span>
          </div>
        )}

        <div className="signature-line" />

      </div>

      <small className="signature-hint">
        Use o dedo na tela do
        celular ou o mouse no
        computador.
      </small>

    </div>
  );
}

/* =========================
   MODAL
========================= */

function Modal({
  title,
  onClose,
  children
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="modal">

        <div className="modal-head">

          <h2>
            {title}
          </h2>

          <button
            className="icon-btn small modal-close"
            onClick={
              onClose
            }
            type="button"
          >
            <X />
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}

function ModalButtons({
  onClose,
  text
}) {
  return (
    <div className="modal-buttons">

      <button
        type="button"
        className="secondary"
        onClick={
          onClose
        }
      >
        Cancelar
      </button>

      <button
        type="submit"
        className="primary"
      >
        <Save
          size={17}
        />
        {text}
      </button>

    </div>
  );
}

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <App />
);