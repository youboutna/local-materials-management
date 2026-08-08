/**
 * PhaseStepResourceDialog
 * Ajout manuel d'une ressource rattachée à une étape de phase :
 *   - Matériau (via QuantityTakeoff)
 *   - Main d'œuvre (employé interne)
 *   - Prestation (fournisseur / consultant externe)
 *
 * UI uniquement : passe par les hooks hexagonaux existants
 * (mem://constraints/no-direct-supabase-in-react).
 * Le rattachement à l'étape est encodé dans `note` JSON
 * tant qu'une colonne `step_id` dédiée n'existe pas en DB.
 */

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAvailableMaterials,
  useCreateQuantityTakeoff,
} from "@/hooks/hexagonal";
import { usePhaseEmployeesHex } from "@/hooks/hexagonal/usePhaseEmployeesHex";
import { calculateQuantity } from "@/dtos/types/quantityTakeoff";
import EmployeeSelector from "@/components/selectors/EmployeeSelector";
import SimpleSupplierSelector from "@/components/selectors/SimpleSupplierSelector";

interface PhaseStepResourceDialogProps {
  projectId: string;
  phaseId: string;
  stepId: string;
  stepName?: string;
  trigger?: React.ReactNode;
}

const UNITS: Array<"m³" | "m²" | "m" | "unité"> = ["m³", "m²", "m", "unité"];

const PhaseStepResourceDialog: React.FC<PhaseStepResourceDialogProps> = ({
  projectId,
  phaseId,
  stepId,
  stepName,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("material");
  const { toast } = useToast();

  // --- Matériau ---
  const { data: materials = [] } = useAvailableMaterials();
  const createTakeoff = useCreateQuantityTakeoff(projectId);
  const [matId, setMatId] = useState("");
  const [unit, setUnit] = useState<"m³" | "m²" | "m" | "unité">("m");
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number | undefined>();
  const [height, setHeight] = useState<number | undefined>();
  const [unitPrice, setUnitPrice] = useState<number | undefined>();

  const computedQuantity = useMemo(
    () => calculateQuantity(length || 0, width, height, unit),
    [length, width, height, unit]
  );

  const canSubmitMaterial = !!matId && length > 0;

  const submitMaterial = async () => {
    if (!canSubmitMaterial) return;
    try {
      await createTakeoff.mutateAsync({
        material_id: matId,
        element_type: "STEP_RESOURCE",
        unit,
        length,
        width,
        height,
        unit_price: unitPrice,
        phase_id: phaseId,
        note: JSON.stringify({ source: "manual", stepId, stepName }),
      });
      toast({ title: "Matériau ajouté", description: "Métré enregistré." });
      setMatId("");
      setLength(0);
      setWidth(undefined);
      setHeight(undefined);
      setUnitPrice(undefined);
      setOpen(false);
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Échec de l'ajout",
        variant: "destructive",
      });
    }
  };

  // --- Main d'œuvre ---
  const phaseEmployees = usePhaseEmployeesHex(phaseId);
  const [empId, setEmpId] = useState<string>("");
  const [empRole, setEmpRole] = useState("");
  const [dailyRate, setDailyRate] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const submitEmployee = async () => {
    if (!empId || !empRole) return;
    try {
      await phaseEmployees.addEmployee({
        employee_name: empId,
        employee_role: empRole,
        daily_rate: dailyRate,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        employee_contact: JSON.stringify({ stepId, employeeId: empId }),
      });
      toast({ title: "Main d'œuvre ajoutée" });
      setEmpId("");
      setEmpRole("");
      setDailyRate(undefined);
      setStartDate("");
      setEndDate("");
      setOpen(false);
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Échec de l'ajout",
        variant: "destructive",
      });
    }
  };

  // --- Prestation ---
  const [supplierId, setSupplierId] = useState<string>("");
  const [amount, setAmount] = useState<number | undefined>();

  const submitService = async () => {
    if (!supplierId) return;
    // There is no dedicated step-level "service/prestation" table in the
    // schema (only project-level quantity takeoffs exist), so this reuses
    // the quantity-takeoff table as a neutral, real, persisted record for
    // financial traceability, tagging it via `note` until a dedicated
    // table/hook exists.
    try {
      await createTakeoff.mutateAsync({
        material_id: supplierId, // référence libre — sera supplanté par hook dédié
        element_type: "SERVICE",
        unit: "unité",
        length: 1,
        unit_price: amount,
        phase_id: phaseId,
        note: JSON.stringify({
          source: "manual",
          kind: "service",
          stepId,
          supplierId,
        }),
      });
      toast({ title: "Prestation ajoutée" });
      setSupplierId("");
      setAmount(undefined);
      setOpen(false);
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Échec de l'ajout",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ressource
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une ressource</DialogTitle>
          <DialogDescription>
            {stepName ? `Étape : ${stepName}` : "Étape sélectionnée"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="material">Matériau</TabsTrigger>
            <TabsTrigger value="employee">Main d'œuvre</TabsTrigger>
            <TabsTrigger value="service">Prestation</TabsTrigger>
          </TabsList>

          <TabsContent value="material" className="space-y-3 pt-4">
            <div>
              <Label>Matériau</Label>
              <Select value={matId} onValueChange={setMatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un matériau" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {m.unit ? `(${m.unit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unité</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prix unitaire (MRU)</Label>
                <Input
                  type="number"
                  value={unitPrice ?? ""}
                  onChange={(e) =>
                    setUnitPrice(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Longueur</Label>
                <Input
                  type="number"
                  value={length || ""}
                  onChange={(e) => setLength(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Largeur</Label>
                <Input
                  type="number"
                  value={width ?? ""}
                  onChange={(e) =>
                    setWidth(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  disabled={unit === "m" || unit === "unité"}
                />
              </div>
              <div>
                <Label>Hauteur</Label>
                <Input
                  type="number"
                  value={height ?? ""}
                  onChange={(e) =>
                    setHeight(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  disabled={unit !== "m³"}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Quantité calculée :{" "}
              <span className="font-medium text-foreground">
                {computedQuantity.toLocaleString("fr-FR")} {unit}
              </span>
            </p>
          </TabsContent>

          <TabsContent value="employee" className="space-y-3 pt-4">
            <EmployeeSelector
              label="Employé"
              value={empId}
              onChange={(id) => setEmpId(id || "")}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rôle sur l'étape</Label>
                <Input
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  placeholder="Chef d'équipe, ouvrier…"
                />
              </div>
              <div>
                <Label>Taux journalier (MRU)</Label>
                <Input
                  type="number"
                  value={dailyRate ?? ""}
                  onChange={(e) =>
                    setDailyRate(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <Label>Début</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="service" className="space-y-3 pt-4">
            <SimpleSupplierSelector
              label="Fournisseur / Consultant"
              value={supplierId}
              onChange={(id) => setSupplierId(id || "")}
            />
            <div>
              <Label>Montant (MRU)</Label>
              <Input
                type="number"
                value={amount ?? ""}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          {tab === "material" && (
            <Button onClick={submitMaterial} disabled={!canSubmitMaterial || createTakeoff.isPending}>
              Ajouter matériau
            </Button>
          )}
          {tab === "employee" && (
            <Button onClick={submitEmployee} disabled={!empId || !empRole}>
              Ajouter main d'œuvre
            </Button>
          )}
          {tab === "service" && (
            <Button onClick={submitService} disabled={!supplierId}>
              Ajouter prestation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhaseStepResourceDialog;
