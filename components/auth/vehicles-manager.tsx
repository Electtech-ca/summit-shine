"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  colour: string | null;
  plate: string | null;
  size: "SEDAN" | "SUV" | "TRUCK" | "OVERSIZED";
};

const SIZE_LABELS: Record<Vehicle["size"], string> = {
  SEDAN: "Sedan",
  SUV: "SUV / Crossover",
  TRUCK: "Truck / Van",
  OVERSIZED: "Oversized",
};

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/account/vehicles");
  if (!res.ok) throw new Error("Failed to load vehicles");
  return res.json();
}

export function VehiclesManager() {
  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [colour, setColour] = useState("");
  const [plate, setPlate] = useState("");
  const [size, setSize] = useState<Vehicle["size"]>("SEDAN");

  const createVehicle = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ make, model, colour, plate, size }),
      });
      if (!res.ok) throw new Error("Failed to add vehicle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setMake("");
      setModel("");
      setColour("");
      setPlate("");
      setSize("SEDAN");
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/account/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove vehicle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createVehicle.mutate();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colour">Colour</Label>
              <Input id="colour" value={colour} onChange={(e) => setColour(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Licence Plate</Label>
              <Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Vehicle Size</Label>
              <Select value={size} onValueChange={(v) => setSize(v as Vehicle["size"])}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIZE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? "Adding..." : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading vehicles...</p>}
        {vehicles?.length === 0 && (
          <p className="text-sm text-muted-foreground">No vehicles saved yet.</p>
        )}
        {vehicles?.map((v) => (
          <Card key={v.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">
                  {v.colour ? `${v.colour} ` : ""}
                  {v.make} {v.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {SIZE_LABELS[v.size]}
                  {v.plate ? ` · ${v.plate}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteVehicle.mutate(v.id)}
                disabled={deleteVehicle.isPending}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
