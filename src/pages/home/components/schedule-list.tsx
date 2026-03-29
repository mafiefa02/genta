import { NoDataIllustration } from "@shared/components/illustrations/no-data";
import { WarningIllustration } from "@shared/components/illustrations/warning";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import {
	Dialog,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@shared/components/ui/dialog";
import {
	Field,
	FieldLabel,
} from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@shared/components/ui/select";
import { Separator } from "@shared/components/ui/separator";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Schedules } from "@shared/lib/db";
import { useDebounce } from "@shared/lib/hooks";
import { services } from "@shared/lib/services";
import {
	cn,
	formatDate,
	ISO_DAY_LABELS,
	minutesToTime,
	timeToMinutes,
} from "@shared/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Selectable } from "kysely";
import {
	CalendarIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	EditIcon,
	RepeatIcon,
	TrashIcon,
	Volume2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBusinessDays } from "@features/profiles/hooks";
import { useDateContext } from "../contexts/date-context";
import { useSearchContext } from "../contexts/search-context";

export const ScheduleList = ({
	className,
	...props
}: React.ComponentProps<"div">) => {
	const { date } = useDateContext();
	const { search } = useSearchContext();
	const debouncedSearch = useDebounce(search, 250);

	const { data, isPending, isError, error } = useQuery(
		services.schedule.query.getSchedules({
			profileId: "currentProfile",
			date: formatDate(date),
			search: debouncedSearch,
		}),
	);

	const oneTimeSchedules = data?.filter((s) => s.repeat === "once");
	const weeklySchedules = data?.filter((s) => s.repeat === "weekly");

	const [editData, setEditData] = useState<{
		id: number;
		name: string;
		time: number;
		soundId: number | null;
		repeat?: Selectable<Schedules>["repeat"];
	} | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	return (
		<>
			<div className={cn("flex flex-1 flex-col gap-3", className)} {...props}>
				{isPending ? (
					<ScheduleListPending />
				) : isError ? (
					<ScheduleListError error={error.message} />
				) : data.length === 0 ? (
					<ScheduleListEmpty />
				) : (
					<>
						{oneTimeSchedules && oneTimeSchedules.length > 0 && (
							<OneTimeSection
								schedules={oneTimeSchedules}
								date={date}
								onEdit={(d) => setEditData(d)}
								onDelete={(id) => setDeleteId(id)}
							/>
						)}
						{oneTimeSchedules &&
							oneTimeSchedules.length > 0 &&
							weeklySchedules &&
							weeklySchedules.length > 0 && <Separator />}
						{weeklySchedules?.map((schedule) => (
							<ScheduleListItem
								key={schedule.id}
								id={schedule.id}
								time={schedule.final_time}
								name={schedule.name}
								soundName={schedule.sound_name}
								soundId={schedule.final_sound_id}
								repeat={schedule.repeat}
								onEdit={() =>
									setEditData({
										id: schedule.id,
										name: schedule.name,
										time: schedule.final_time,
										soundId: schedule.final_sound_id,
										repeat: schedule.repeat,
									})
								}
								onDelete={() => setDeleteId(schedule.id)}
							/>
						))}
					</>
				)}
			</div>
			<ScheduleEditDialog
				data={editData}
				scheduleDate={date}
				onOpenChange={(open) => !open && setEditData(null)}
			/>
			<ScheduleDeleteDialog
				id={deleteId}
				scheduleDate={date}
				onOpenChange={(open) => !open && setDeleteId(null)}
			/>
		</>
	);
};

const OneTimeSection = ({
	schedules,
	date,
	onEdit,
	onDelete,
}: {
	schedules: {
		id: number;
		name: string;
		final_time: number;
		final_sound_id: number | null;
		sound_name: string;
	}[];
	date: Date;
	onEdit: (data: {
		id: number;
		name: string;
		time: number;
		soundId: number | null;
	}) => void;
	onDelete: (id: number) => void;
}) => {
	const [open, setOpen] = useState(true);

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
				onClick={() => setOpen((prev) => !prev)}
			>
				{open ? (
					<ChevronDownIcon className="size-4" />
				) : (
					<ChevronRightIcon className="size-4" />
				)}
				One-time schedules ({schedules.length})
			</button>
			{open &&
				schedules.map((schedule) => (
					<OneTimeListItem
						key={schedule.id}
						id={schedule.id}
						time={schedule.final_time}
						name={schedule.name}
						soundName={schedule.sound_name}
						soundId={schedule.final_sound_id}
						scheduleDate={date}
						onEdit={() =>
							onEdit({
								id: schedule.id,
								name: schedule.name,
								time: schedule.final_time,
								soundId: schedule.final_sound_id,
							})
						}
						onDelete={() => onDelete(schedule.id)}
					/>
				))}
		</div>
	);
};

const OneTimeListItem = ({
	time,
	name,
	soundName,
	scheduleDate,
	onEdit,
	onDelete,
}: {
	id: number;
	time: number;
	name: string;
	soundName: string;
	soundId: number | null;
	scheduleDate: Date;
	onEdit: () => void;
	onDelete: () => void;
}) => {
	return (
		<Card className="group border-dashed">
			<CardContent className="relative flex items-center gap-4">
				<h1 className="text-lg font-semibold tabular-nums">
					{minutesToTime(time)}
				</h1>
				<Separator orientation="vertical" />
				<div className="flex flex-col gap-1">
					<h1 className="font-semibold">{name}</h1>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<ScheduleInfo>
							<CalendarIcon className="size-3.5" />
							<p>{format(scheduleDate, "PP")}</p>
						</ScheduleInfo>
						<ScheduleInfo>
							<Volume2Icon className="size-3.5" />
							<p>{soundName ?? "Default"}</p>
						</ScheduleInfo>
					</div>
				</div>
				<div className="absolute right-0 hidden h-full items-center gap-3 bg-card mask-[linear-gradient(to_right,transparent,theme(--color-card)_2rem)] pr-4 pl-10 group-hover:flex [&_svg]:size-4!">
					<Button variant="outline" size="icon" onClick={onEdit}>
						<EditIcon />
					</Button>
					<Button variant="destructive-outline" size="icon" onClick={onDelete}>
						<TrashIcon />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

const ScheduleListItem = ({
	time,
	name,
	soundName,
	repeat,
	onEdit,
	onDelete,
}: {
	id: number;
	time: number;
	name: string;
	soundName: string;
	soundId: number | null;
	repeat: Selectable<Schedules>["repeat"];
	onEdit: () => void;
	onDelete: () => void;
}) => {
	return (
		<Card className="group">
			<CardContent className="relative flex items-center gap-4">
				<h1 className="text-lg font-semibold tabular-nums">
					{minutesToTime(time)}
				</h1>
				<Separator orientation="vertical" />
				<div className="flex flex-col gap-1">
					<h1 className="font-semibold">{name}</h1>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<ScheduleInfo>
							<Volume2Icon className="size-3.5" />
							<p>{soundName ?? "Default"}</p>
						</ScheduleInfo>
						<ScheduleInfo>
							<RepeatIcon className="size-3.5" />
							<p className="capitalize">{repeat}</p>
						</ScheduleInfo>
					</div>
				</div>
				<div className="absolute right-0 hidden h-full items-center gap-3 bg-card mask-[linear-gradient(to_right,transparent,theme(--color-card)_2rem)] pr-4 pl-10 group-hover:flex [&_svg]:size-4!">
					<Button variant="outline" size="icon" onClick={onEdit}>
						<EditIcon />
					</Button>
					<Button variant="destructive-outline" size="icon" onClick={onDelete}>
						<TrashIcon />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

const selectSounds = (sounds: { id: number; name: string }[]) => [
	{ label: "Default", value: null },
	...sounds.map((s) => ({ label: s.name, value: String(s.id) })),
];

const ScheduleEditDialog = ({
	data,
	scheduleDate,
	onOpenChange,
}: {
	data: {
		id: number;
		name: string;
		time: number;
		soundId: number | null;
		repeat?: Selectable<Schedules>["repeat"];
	} | null;
	scheduleDate: Date;
	onOpenChange: (open: boolean) => void;
}) => {
	return (
		<Dialog open={data !== null} onOpenChange={onOpenChange}>
			<DialogPopup>
				{data && (
					<ScheduleEditForm
						id={data.id}
						initialData={{
							name: data.name,
							time: data.time,
							soundId: data.soundId,
						}}
						repeat={data.repeat}
						scheduleDate={scheduleDate}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogPopup>
		</Dialog>
	);
};

const ScheduleEditForm = ({
	id,
	initialData,
	repeat,
	scheduleDate,
	onClose,
}: {
	id: Selectable<Schedules>["id"];
	initialData: {
		name: string;
		time: number;
		soundId: number | null;
	};
	repeat?: Selectable<Schedules>["repeat"];
	scheduleDate: Date;
	onClose: () => void;
}) => {
	const queryClient = useQueryClient();
	const businessDays = useBusinessDays();

	const [formState, setFormState] = useState({
		name: initialData.name,
		time: minutesToTime(initialData.time),
		soundId: initialData.soundId,
		days: [] as number[],
	});

	const { data: existingDays } = useQuery({
		...services.schedule.query.getScheduleDays(id),
		enabled: repeat === "weekly",
	});

	useEffect(() => {
		if (existingDays) {
			setFormState((prev) => ({ ...prev, days: existingDays }));
		}
	}, [existingDays]);

	const { data: sounds } = useQuery({
		...services.sound.query.getSounds,
		select: selectSounds,
	});

	const { mutate, isPending } = useMutation(
		services.schedule.mutation.updateSchedule({
			id,
			date: format(scheduleDate, "yyyy-MM-dd"),
		}),
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			mutate(
				{
					updateType: "all",
					values: {
						name: formState.name,
						time: timeToMinutes(formState.time) || 0,
						sound_id: formState.soundId,
						is_cancelled: false,
						...(repeat === "weekly" && { days: formState.days }),
					},
				},
				{
					onSuccess: () => {
						queryClient.invalidateQueries({ queryKey: ["schedules"] });
						queryClient.invalidateQueries({
							queryKey: ["schedule-days", id],
						});
						onClose();
					},
				},
			);
		},
		[mutate, formState, queryClient, repeat, id, onClose],
	);

	const handleToggleDay = useCallback((day: number) => {
		setFormState((prev) => {
			const isSelected = prev.days.includes(day);
			const next = isSelected
				? prev.days.filter((d) => d !== day)
				: [...prev.days, day].sort((a, b) => a - b);
			return { ...prev, days: next.length > 0 ? next : prev.days };
		});
	}, []);

	return (
		<form onSubmit={handleSubmit} className="contents">
			<DialogHeader>
				<DialogTitle>Edit Schedule</DialogTitle>
				<DialogDescription>
					Make changes to the schedule&apos;s information.
				</DialogDescription>
			</DialogHeader>
			<DialogPanel className="grid gap-4">
				<Field>
					<FieldLabel>Name</FieldLabel>
					<Input
						value={formState.name}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, name: e.target.value }))
						}
					/>
				</Field>
				<Field>
					<FieldLabel>Time</FieldLabel>
					<Input
						type="time"
						value={formState.time}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, time: e.target.value }))
						}
					/>
				</Field>
				{repeat === "weekly" && (
					<Field>
						<FieldLabel>Days</FieldLabel>
						<div className="flex w-full items-center gap-1">
							{businessDays.map((day) => {
								const isActive = formState.days.includes(day);
								return (
									<Button
										key={day}
										type="button"
										variant={isActive ? "default" : "outline"}
										size="sm"
										className={cn(
											"flex-1",
											!isActive && "text-muted-foreground",
										)}
										onClick={() => handleToggleDay(day)}
									>
										{ISO_DAY_LABELS[day]}
									</Button>
								);
							})}
						</div>
					</Field>
				)}
				<Field>
					<FieldLabel>Sound</FieldLabel>
					<Select
						value={
							formState.soundId === null
								? "null"
								: String(formState.soundId)
						}
						onValueChange={(val) =>
							setFormState((prev) => ({
								...prev,
								soundId: val === "null" ? null : Number(val),
							}))
						}
						items={
							sounds?.map((s) => ({
								...s,
								value: s.value === null ? "null" : s.value,
							})) ?? []
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectPopup>
							{sounds?.map((sound) => (
								<SelectItem
									key={sound.value ?? "null"}
									value={sound.value ?? "null"}
								>
									{sound.label}
								</SelectItem>
							))}
						</SelectPopup>
					</Select>
				</Field>
			</DialogPanel>
			<DialogFooter>
				<Button
					type="button"
					variant="ghost"
					onClick={onClose}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isPending}>Save Changes</Button>
			</DialogFooter>
		</form>
	);
};

const ScheduleDeleteDialog = ({
	id,
	scheduleDate,
	onOpenChange,
}: {
	id: number | null;
	scheduleDate: Date;
	onOpenChange: (open: boolean) => void;
}) => {
	const queryClient = useQueryClient();

	const { mutate } = useMutation(
		services.schedule.mutation.deleteSchedule({
			id: id ?? 0,
			date: format(scheduleDate, "yyyy-MM-dd"),
		}),
	);

	return (
		<Dialog open={id !== null} onOpenChange={onOpenChange}>
			<DialogPopup>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						This will permanently delete this schedule.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							mutate("all", {
								onSuccess: () => {
									queryClient.invalidateQueries({ queryKey: ["schedules"] });
									onOpenChange(false);
								},
							});
						}}
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
};

const ScheduleInfo = ({ className, ...props }: React.ComponentProps<"div">) => {
	return (
		<div className={cn("flex items-center gap-1", className)} {...props} />
	);
};

const ScheduleListPending = ({
	className,
	...props
}: React.ComponentProps<"div">) => {
	const [skeletonCount] = useState(() => Math.floor(Math.random() * 4) + 3);
	return (
		<div className={cn("flex flex-1 flex-col gap-3", className)} {...props}>
			{Array.from({ length: skeletonCount }).map((_, i) => (
				<Skeleton key={`skeleton-${i}`} className="h-24 w-full rounded-2xl" />
			))}
		</div>
	);
};

const ScheduleListError = ({
	className,
	error,
	...props
}: React.ComponentProps<"div"> & { error: string }) => {
	return (
		<div
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-4 px-8",
				className,
			)}
			{...props}
		>
			<WarningIllustration className="size-40" />
			<div className="flex max-w-[60ch] flex-col gap-1 text-center">
				<h1 className="text-xl font-semibold">Oops! Something went wrong</h1>
				<h3 className="text-balance text-muted-foreground">{error}</h3>
			</div>
		</div>
	);
};

const ScheduleListEmpty = ({
	className,
	...props
}: React.ComponentProps<"div">) => {
	return (
		<div
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-4 px-8",
				className,
			)}
			{...props}
		>
			<NoDataIllustration className="size-40" />
			<div className="flex max-w-[60ch] flex-col gap-1 text-center">
				<h1 className="text-xl font-semibold">No Data Found</h1>
				<h3 className="text-balance text-muted-foreground">
					Looks like we couldn&apos;t find what you&apos;re looking for.
				</h3>
			</div>
		</div>
	);
};
