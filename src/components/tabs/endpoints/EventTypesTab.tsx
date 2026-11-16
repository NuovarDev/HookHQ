"use client";

import { useEffect, useRef, useState } from "react";
import { Code, Copy, Download, Edit, Plus, Power, PowerOff, Trash2, Upload, Zap } from "lucide-react";
import EditableTemplate from "@/components/EditableTemplate";
import { EmptyStateCard, LoadingStateCard } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createEventType,
  deleteEventType,
  fetchEventTypes,
  type EventType,
  type EventTypeVariable,
  updateEventType,
} from "@/lib/webhookApi";
import { getPublicApiUrl } from "@/lib/publicApi/utils";
import { toast } from "sonner";

type EventTypeFormState = {
  name: string;
  description: string;
  schema: string;
  examplePayload: string;
  variables: EventTypeVariable[];
  enabled: boolean;
};

const initialFormState: EventTypeFormState = {
  name: "",
  description: "",
  schema: "",
  examplePayload: "",
  variables: [],
  enabled: true,
};

type PortableEventType = {
  name: string;
  description?: string;
  schema?: Record<string, unknown>;
  examplePayload?: Record<string, unknown>;
  variables: EventTypeVariable[];
  enabled: boolean;
};

type ImportSelection = {
  eventType: PortableEventType;
  selected: boolean;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseImportedEventTypes(value: unknown): PortableEventType[] {
  const imported = Array.isArray(value) ? value : isRecord(value) ? value.eventTypes : undefined;
  if (!Array.isArray(imported)) {
    throw new Error('Expected a JSON array or an object with an "eventTypes" array.');
  }

  return imported.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Event type ${index + 1} must be an object.`);

    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) throw new Error(`Event type ${index + 1} needs a name.`);

    if (item.description !== undefined && item.description !== null && typeof item.description !== "string") {
      throw new Error(`Description for "${name}" must be a string.`);
    }
    if (item.schema !== undefined && item.schema !== null && !isRecord(item.schema)) {
      throw new Error(`Schema for "${name}" must be a JSON object.`);
    }
    if (item.examplePayload !== undefined && item.examplePayload !== null && !isRecord(item.examplePayload)) {
      throw new Error(`Example payload for "${name}" must be a JSON object.`);
    }
    if (item.enabled !== undefined && typeof item.enabled !== "boolean") {
      throw new Error(`Enabled for "${name}" must be true or false.`);
    }

    const variables = item.variables ?? [];
    if (!Array.isArray(variables)) throw new Error(`Variables for "${name}" must be an array.`);
    const parsedVariables = variables.map((variable, variableIndex) => {
      if (
        !isRecord(variable) ||
        typeof variable.name !== "string" ||
        typeof variable.description !== "string" ||
        typeof variable.example !== "string"
      ) {
        throw new Error(`Variable ${variableIndex + 1} for "${name}" must include name, description, and example.`);
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(variable.name)) {
        throw new Error(`Variable "${variable.name}" for "${name}" has an invalid name.`);
      }
      return { name: variable.name, description: variable.description, example: variable.example };
    });

    return {
      name,
      description: typeof item.description === "string" && item.description.trim() ? item.description : undefined,
      schema: isRecord(item.schema) ? item.schema : undefined,
      examplePayload: isRecord(item.examplePayload) ? item.examplePayload : undefined,
      variables: parsedVariables,
      enabled: item.enabled ?? true,
    };
  });
}

function getImportNameErrors(importSelections: ImportSelection[], existingNames: Set<string>) {
  const errors = new Map<number, string>();
  const selectedNames = new Map<string, number[]>();

  importSelections.forEach((selection, index) => {
    if (!selection.selected) return;
    const name = selection.name.trim();
    if (!name) {
      errors.set(index, "A name is required.");
      return;
    }
    if (existingNames.has(name)) {
      errors.set(index, "An event type with this name already exists.");
      return;
    }
    selectedNames.set(name, [...(selectedNames.get(name) ?? []), index]);
  });

  selectedNames.forEach(indices => {
    if (indices.length < 2) return;
    indices.forEach(index => errors.set(index, "Selected event types must have unique names."));
  });

  return errors;
}

function parseSchema(schema: string) {
  if (!schema.trim()) {
    return undefined;
  }

  return JSON.parse(schema) as Record<string, unknown>;
}

export default function EventTypesTab() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState<EventTypeFormState>(initialFormState);
  const [duplicateSource, setDuplicateSource] = useState<EventType | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateDescription, setDuplicateDescription] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importSelections, setImportSelections] = useState<ImportSelection[] | null>(null);
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEventTypes() {
      try {
        const nextEventTypes = await fetchEventTypes();
        if (isMounted) {
          setEventTypes(nextEventTypes);
        }
      } catch (nextError) {
        if (isMounted) {
          toast.error(nextError instanceof Error ? nextError.message : "Failed to load event types");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEventTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  function resetForm() {
    setFormData(initialFormState);
    setEditingEventType(null);
  }

  function openCreateDialog() {
    resetForm();
    setCreateDialogOpen(true);
  }

  function openEditDialog(eventType: EventType) {
    setFormData({
      name: eventType.name,
      description: eventType.description || "",
      schema: eventType.schema ? JSON.stringify(eventType.schema, null, 2) : "",
      examplePayload: eventType.examplePayload ? JSON.stringify(eventType.examplePayload, null, 2) : "",
      variables: eventType.variables ?? [],
      enabled: eventType.enabled,
    });
    setEditingEventType(eventType);
    setCreateDialogOpen(true);
  }

  function openDuplicateDialog(eventType: EventType) {
    setDuplicateSource(eventType);
    setDuplicateName(`${eventType.name}.copy`);
    setDuplicateDescription(eventType.description || "");
  }

  function closeDuplicateDialog() {
    setDuplicateSource(null);
    setDuplicateName("");
    setDuplicateDescription("");
  }

  async function handleDuplicate() {
    if (!duplicateSource || !duplicateName.trim()) {
      return;
    }

    try {
      const duplicatedEventType = await createEventType({
        name: duplicateName.trim(),
        description: duplicateDescription.trim() || undefined,
        schema: duplicateSource.schema ?? undefined,
        examplePayload: duplicateSource.examplePayload ?? undefined,
        variables: duplicateSource.variables.map(variable => ({ ...variable })),
        enabled: duplicateSource.enabled,
      });
      setEventTypes(current => [...current, duplicatedEventType]);
      closeDuplicateDialog();
      toast.success("Event type duplicated");
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to duplicate event type");
    }
  }

  async function handleSubmit() {
    try {
      const examplePayload = formData.examplePayload.trim() ? parseSchema(formData.examplePayload) : null;
      const basePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        schema: parseSchema(formData.schema),
        variables: formData.variables,
        enabled: formData.enabled,
      };

      if (editingEventType) {
        const updatedEventType = await updateEventType(editingEventType.id, { ...basePayload, examplePayload });
        setEventTypes(current =>
          current.map(eventType => (eventType.id === editingEventType.id ? updatedEventType : eventType))
        );
      } else {
        const createdEventType = await createEventType(
          examplePayload ? { ...basePayload, examplePayload } : basePayload
        );
        setEventTypes(current => [...current, createdEventType]);
      }

      setCreateDialogOpen(false);
      resetForm();
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to save event type");
    }
  }

  async function handleToggleEventType(eventType: EventType) {
    try {
      const updatedEventType = await updateEventType(eventType.id, { enabled: !eventType.enabled });
      setEventTypes(current => current.map(item => (item.id === eventType.id ? updatedEventType : item)));
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to update event type");
    }
  }

  async function handleDeleteEventType(id: string) {
    if (!confirm("Are you sure you want to delete this event type?")) return;

    try {
      await deleteEventType(id);
      setEventTypes(current => current.filter(eventType => eventType.id !== id));
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to delete event type");
    }
  }

  function handleExport() {
    const portableEventTypes: PortableEventType[] = eventTypes.map(eventType => ({
      name: eventType.name,
      ...(eventType.description ? { description: eventType.description } : {}),
      ...(eventType.schema ? { schema: eventType.schema } : {}),
      ...(eventType.examplePayload ? { examplePayload: eventType.examplePayload } : {}),
      variables: eventType.variables ?? [],
      enabled: eventType.enabled,
    }));
    const file = new Blob([JSON.stringify({ version: 1, eventTypes: portableEventTypes }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hookhq-event-types.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${portableEventTypes.length} event type${portableEventTypes.length === 1 ? "" : "s"}`);
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportJson(await file.text());
      setImportSelections(null);
    } catch {
      toast.error("Unable to read the selected file");
    } finally {
      event.target.value = "";
    }
  }

  function handleReviewImport() {
    let importedEventTypes: PortableEventType[];
    try {
      importedEventTypes = parseImportedEventTypes(JSON.parse(importJson));
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Invalid event types JSON");
      return;
    }

    if (importedEventTypes.length === 0) {
      toast.info("The JSON file does not contain any event types");
      return;
    }

    setImportSelections(importedEventTypes.map(eventType => ({ eventType, selected: true, name: eventType.name })));
  }

  async function handleImport() {
    if (!importSelections) return;

    const existingNames = new Set(eventTypes.map(eventType => eventType.name));
    const nameErrors = getImportNameErrors(importSelections, existingNames);
    const eventTypesToCreate = importSelections
      .filter(selection => selection.selected)
      .map(selection => ({ ...selection.eventType, name: selection.name.trim() }));
    if (nameErrors.size || eventTypesToCreate.length === 0) {
      toast.error(
        nameErrors.size ? "Resolve duplicate event type names before importing" : "Select an event type to import"
      );
      return;
    }

    setImporting(true);
    const created: EventType[] = [];
    try {
      for (const eventType of eventTypesToCreate) {
        created.push(await createEventType(eventType));
      }
      setEventTypes(current => [...current, ...created]);
      setImportDialogOpen(false);
      setImportJson("");
      setImportSelections(null);
      toast.success(`Imported ${created.length} event type${created.length === 1 ? "" : "s"}`);
    } catch (nextError) {
      if (created.length) setEventTypes(current => [...current, ...created]);
      toast.error(
        `${nextError instanceof Error ? nextError.message : "Import failed"}. ${created.length} event type${
          created.length === 1 ? " was" : "s were"
        } imported before the error.`
      );
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return <LoadingStateCard />;
  }

  const existingEventTypeNames = new Set(eventTypes.map(eventType => eventType.name));
  const importNameErrors = importSelections ? getImportNameErrors(importSelections, existingEventTypeNames) : new Map();
  const selectedImportCount = importSelections?.filter(selection => selection.selected).length ?? 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Types</h2>
          <p className="text-muted-foreground">Define event schemas for structured event notifications</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            Import JSON
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Create Event Type
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-4 overflow-hidden p-4 sm:w-[calc(100vw-4rem)] sm:p-6">
              <DialogHeader>
                <DialogTitle>{editingEventType ? "Edit Event Type" : "Create New Event Type"}</DialogTitle>
                <DialogDescription>
                  {editingEventType
                    ? "Update your event type configuration"
                    : "Define a new event type with its payload schema"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain px-1 py-4 sm:px-2">
                <div className="space-y-2">
                  <Label htmlFor="event-type-name">Name *</Label>
                  <Input
                    id="event-type-name"
                    value={formData.name}
                    onChange={event => setFormData(current => ({ ...current, name: event.target.value }))}
                    placeholder="user.created"
                  />
                </div>

                <div className="space-y-3 rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Template variables</Label>
                      <p className="text-sm text-muted-foreground">
                        Endpoints can use these values in their URL, headers, and payload template.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData(current => ({
                          ...current,
                          variables: [...current.variables, { name: "", description: "", example: "" }],
                        }))
                      }
                    >
                      <Plus className="h-4 w-4" /> Add variable
                    </Button>
                  </div>
                  {formData.variables.length > 0 && (
                    <div className="hidden gap-2 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[1fr_2fr_2fr_auto]">
                      <span>Variable name</span>
                      <span>Description</span>
                      <span>Example value</span>
                      <span aria-hidden="true" className="w-9" />
                    </div>
                  )}
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-[1fr_2fr_2fr_auto]">
                      <Input
                        aria-label={`Variable ${index + 1} name`}
                        value={variable.name}
                        onChange={event =>
                          setFormData(current => ({
                            ...current,
                            variables: current.variables.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item
                            ),
                          }))
                        }
                        placeholder="userId"
                      />
                      <Input
                        aria-label={`Variable ${index + 1} description`}
                        value={variable.description}
                        onChange={event =>
                          setFormData(current => ({
                            ...current,
                            variables: current.variables.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, description: event.target.value } : item
                            ),
                          }))
                        }
                        placeholder="The ID of the created user"
                      />
                      <Input
                        aria-label={`Variable ${index + 1} example`}
                        value={variable.example}
                        onChange={event =>
                          setFormData(current => ({
                            ...current,
                            variables: current.variables.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, example: event.target.value } : item
                            ),
                          }))
                        }
                        placeholder="usr_123"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove variable ${variable.name || index + 1}`}
                        onClick={() =>
                          setFormData(current => ({
                            ...current,
                            variables: current.variables.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-type-description">Description</Label>
                  <Input
                    id="event-type-description"
                    value={formData.description}
                    onChange={event => setFormData(current => ({ ...current, description: event.target.value }))}
                    placeholder="Triggered when a new user is created"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-type-schema">JSON Schema (Optional)</Label>
                  <Textarea
                    id="event-type-schema"
                    className="min-h-[200px] font-mono text-sm"
                    value={formData.schema}
                    onChange={event => setFormData(current => ({ ...current, schema: event.target.value }))}
                    placeholder={`{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string"
    }
  },
  "required": ["userId"]
}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Define the structure of the event payload using JSON Schema.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-type-example-payload">Example Payload (Optional)</Label>
                  <Textarea
                    id="event-type-example-payload"
                    className="min-h-[160px] font-mono text-sm"
                    value={formData.examplePayload}
                    onChange={event => setFormData(current => ({ ...current, examplePayload: event.target.value }))}
                    placeholder={`{
  "userId": "usr_123",
  "email": "customer@example.com"
}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for test deliveries unless the endpoint has its own payload template.
                  </p>
                </div>
              </div>
              <DialogFooter className="shrink-0 border-t pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>{editingEventType ? "Update" : "Create"} Event Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={importDialogOpen}
            onOpenChange={open => {
              setImportDialogOpen(open);
              if (!open) {
                setImportJson("");
                setImportSelections(null);
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{importSelections ? "Review Event Types" : "Import Event Types"}</DialogTitle>
                <DialogDescription>
                  {importSelections
                    ? "Choose the event types to import and resolve each duplicate name before continuing."
                    : "Import a HookHQ event-types JSON file or paste its contents."}
                </DialogDescription>
              </DialogHeader>
              {importSelections ? (
                <div className="max-h-[50vh] overflow-y-auto py-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20 whitespace-nowrap">Import</TableHead>
                        <TableHead className="whitespace-nowrap">Original name</TableHead>
                        <TableHead className="whitespace-nowrap">New name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importSelections.map((selection, index) => {
                        const error = importNameErrors.get(index);
                        const checkboxId = `event-type-import-${index}`;
                        const inputId = `event-type-import-name-${index}`;
                        const errorId = `event-type-import-error-${index}`;

                        return (
                          <TableRow key={`${selection.eventType.name}-${index}`}>
                            <TableCell>
                              <Checkbox
                                id={checkboxId}
                                aria-label={`Import ${selection.eventType.name}`}
                                checked={selection.selected}
                                onCheckedChange={checked =>
                                  setImportSelections(
                                    current =>
                                      current?.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, selected: checked === true } : item
                                      ) ?? null
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">{selection.eventType.name}</TableCell>
                            <TableCell className="min-w-64">
                              <Label htmlFor={inputId} className="sr-only">
                                New name for {selection.eventType.name}
                              </Label>
                              <Input
                                id={inputId}
                                name={`eventTypeImportName${index}`}
                                value={selection.name}
                                disabled={!selection.selected || importing}
                                aria-invalid={Boolean(error)}
                                aria-describedby={error ? errorId : undefined}
                                className={error ? "text-destructive" : undefined}
                                onChange={event =>
                                  setImportSelections(
                                    current =>
                                      current?.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, name: event.target.value } : item
                                      ) ?? null
                                  )
                                }
                              />
                              {error ? (
                                <p id={errorId} className="mt-1 text-sm text-destructive">
                                  {error}
                                </p>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <input
                    ref={importFileRef}
                    id="event-types-import-file"
                    name="eventTypesImportFile"
                    type="file"
                    accept="application/json,.json"
                    aria-label="Choose event types JSON file"
                    className="sr-only"
                    onChange={handleImportFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => importFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Choose JSON file
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="event-types-import-json">Event types JSON</Label>
                    <Textarea
                      id="event-types-import-json"
                      name="eventTypesImportJson"
                      className="min-h-[280px] font-mono text-sm"
                      value={importJson}
                      onChange={event => setImportJson(event.target.value)}
                      placeholder={'{\n  "version": 1,\n  "eventTypes": []\n}'}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>
                  Cancel
                </Button>
                {importSelections ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setImportSelections(null)}
                      disabled={importing}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleImport}
                      disabled={importing || selectedImportCount === 0 || importNameErrors.size > 0}
                    >
                      {importing
                        ? "Importing..."
                        : `Import ${selectedImportCount} event type${selectedImportCount === 1 ? "" : "s"}`}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={handleReviewImport} disabled={!importJson.trim()}>
                    Review event types
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={duplicateSource !== null} onOpenChange={open => !open && closeDuplicateDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Duplicate Event Type</DialogTitle>
              <DialogDescription>
                The JSON schema and template variables from {duplicateSource?.name} will be copied to the new event
                type.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-event-type-name">Name *</Label>
                <Input
                  id="duplicate-event-type-name"
                  value={duplicateName}
                  onChange={event => setDuplicateName(event.target.value)}
                  placeholder="user.created.copy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-event-type-description">Description</Label>
                <Input
                  id="duplicate-event-type-description"
                  value={duplicateDescription}
                  onChange={event => setDuplicateDescription(event.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDuplicateDialog}>
                Cancel
              </Button>
              <Button onClick={handleDuplicate} disabled={!duplicateName.trim()}>
                Duplicate Event Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {eventTypes.length === 0 ? (
        <EmptyStateCard
          icon={Zap}
          title="No Event Types"
          description="Create your first event type to define structured event notifications."
        >
          <code className="m-4 min-w-[500px] rounded-md bg-neutral-600 p-4 text-sm text-white dark:bg-neutral-800">
            <EditableTemplate
              template={`curl ${getPublicApiUrl("event-types", true)} \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer {{apiKey="API KEY"}}' \\
-d '{
  "name": "My First Event Type"
}'`}
              className="whitespace-pre"
            />
          </code>
        </EmptyStateCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map(eventType => (
            <Card key={eventType.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-4 w-4" />
                      {eventType.name}
                    </CardTitle>
                    <CardDescription>{eventType.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(eventType)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDuplicateDialog(eventType)}
                      aria-label={`Duplicate ${eventType.name}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEventType(eventType.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={eventType.enabled ? "default" : "secondary"}>
                        {eventType.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {eventType.schema && (
                        <Badge variant="outline">
                          <Code className="mr-1 h-3 w-3" />
                          Schema
                        </Badge>
                      )}
                      {eventType.examplePayload && <Badge variant="outline">Example payload</Badge>}
                      {(eventType.variables?.length ?? 0) > 0 && (
                        <Badge variant="outline">{eventType.variables.length} variables</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleEventType(eventType)}>
                      {eventType.enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>

                  {eventType.schema && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium">Schema Preview</h4>
                      <div className="max-h-20 overflow-y-auto rounded bg-gray-50 p-2 font-mono text-xs text-gray-600">
                        {JSON.stringify(eventType.schema, null, 2).slice(0, 180)}
                        {JSON.stringify(eventType.schema, null, 2).length > 180 && "..."}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created {new Date(eventType.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
