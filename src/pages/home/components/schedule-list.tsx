import { NoDataIllustration } from "@shared/components/illustrations/no-data";
import { WarningIllustration } from "@shared/components/illustrations/warning";
import { Button } from "@shared/components/ui/button";
import { Calendar } from "@shared/components/ui/calendar";
import { Card, CardContent } from "@shared/components/ui/card";
import {
	Dialog,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from "@shared/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Radio, RadioGroup } from "@shared/components/ui/radio-group";
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from "@shared/components/ui/select";
import {
	Popover,
	PopoverPopup,
	PopoverTrigger,
} from "@shared/components/ui/popover";
import { Separator } from "@shared/components/ui/separator";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Schedules } from "@shared/lib/db";
import { useDebounce } from "@shared/lib/hooks";
import { services } from "@shared/lib/services";
import {
	cn,
	formatDate,
	minutesToTime,
	timeToMinutes,
} from "@shared/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, getISODay } from "date-fns";
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
import { useCallback, useState } from "react";
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

	return (
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
						<OneTimeSection schedules={oneTimeSchedules} date={date} />
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
							scheduleDate={date}
						/>
					))}
				</>
			)}
		</div>
	);
};

const OneTimeSection = ({
	schedules,
	date,
}: {
	schedules: {
		id: number;
		name: string;
		final_time: number;
		final_sound_id: number | null;
		sound_name: string;
	}[];
	date: Date;
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
					/>
				))}
		</div>
	);
};

const OneTimeListItem = ({
	id,
	time,
	name,
	soundName,
	soundId,
	scheduleDate,
}: {
	id: number;
	time: number;
	name: string;
	soundName: string;
	soundId: number | null;
	scheduleDate: Date;
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
					<ScheduleEditButton
						id={id}
						repeat="once"
						initialData={{ name, time, soundId }}
						scheduleDate={scheduleDate}
					/>
					<ScheduleDeleteButton
						id={id}
						repeat="once"
						scheduleDate={scheduleDate}
					/>
				</div>
			</CardContent>
		</Card>
	);
};

const ScheduleListItem = ({
	id,
	time,
	name,
	soundName,
	soundId,
	repeat,
	scheduleDate,
}: {
	id: number;
	time: number;
	name: string;
	soundName: string;
	soundId: number | null;
	repeat: Selectable<Schedules>["repeat"];
	scheduleDate: Date;
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
					<ScheduleEditButton
						id={id}
						repeat={repeat}
						initialData={{ name, time, soundId }}
						scheduleDate={scheduleDate}
					/>
					<ScheduleDeleteButton
						id={id}
						repeat={repeat}
						scheduleDate={scheduleDate}
					/>
				</div>
			</CardContent>
		</Card>
	);
};

const ScheduleEditButton = ({
	id,
	repeat,
	initialData,
	scheduleDate,
}: {
	id: Selectable<Schedules>["id"];
	repeat: Selectable<Schedules>["repeat"];
	initialData: {
		name: string;
		time: number;
		soundId: number | null;
	};
	scheduleDate: Date;
}) => {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const [formState, setFormState] = useState({
		name: initialData.name,
		time: minutesToTime(initialData.time),
		soundId: initialData.soundId,
		skipDates: [] as Date[],
	});

	const { data: sounds } = useQuery({
		...services.sound.query.getSounds,
		select: (sounds) => [
			{ label: "Default", value: null },
			...sounds.map((s) => ({ label: s.name, value: String(s.id) })),
		],
	});

	const { data: scheduleDays } = useQuery({
		...services.schedule.query.getScheduleDays(id),
		enabled: repeat === "weekly",
	});

	const { mutate } = useMutation(
		services.schedule.mutation.updateSchedule({
			id,
			date: format(scheduleDate, "yyyy-MM-dd"),
		}),
	);

	const { mutate: skipMutate } = useMutation(
		services.schedule.mutation.skipScheduleDates({ id }),
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (formState.skipDates.length > 0) {
				skipMutate(
					formState.skipDates.map((d) => formatDate(d)),
					{
						onSuccess: () => {
							queryClient.invalidateQueries({ queryKey: ["schedules"] });
						},
					},
				);
			} else {
				mutate(
					{
						updateType: "all",
						values: {
							name: formState.name,
							time: timeToMinutes(formState.time) || 0,
							sound_id: formState.soundId,
							is_cancelled: false,
						},
					},
					{
						onSuccess: () => {
							queryClient.invalidateQueries({ queryKey: ["schedules"] });
						},
					},
				);
			}
			setOpen(false);
		},
		[mutate, skipMutate, formState, queryClient],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="icon" />}>
				<EditIcon />
			</DialogTrigger>
			<DialogPopup>
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
						{repeat === "weekly" && (
							<Field>
								<FieldLabel>Skip dates</FieldLabel>
								<div className="flex flex-col gap-2 w-full">
									<Popover modal>
										<PopoverTrigger
											render={
												<Button
													variant="outline"
													type="button"
													className="w-full justify-start"
												/>
											}
										>
											<CalendarIcon className="size-4" />
											{formState.skipDates.length === 0
												? "Skip dates..."
												: formState.skipDates
														.sort((a, b) => a.getTime() - b.getTime())
														.map((d) => format(d, "MMM d"))
														.join(", ")}
										</PopoverTrigger>
										<PopoverPopup align="start" side="top">
											<Calendar
												className="bg-popover p-0"
												mode="multiple"
												selected={formState.skipDates}
												onSelect={(dates) =>
													setFormState((prev) => ({
														...prev,
														skipDates: dates ?? [],
													}))
												}
												disabled={(date) =>
													!scheduleDays?.includes(getISODay(date))
												}
											/>
										</PopoverPopup>
									</Popover>
								</div>
								<FieldDescription>
									Select dates to skip this schedule from playing.
								</FieldDescription>
							</Field>
						)}
					</DialogPanel>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</DialogFooter>
				</form>
			</DialogPopup>
		</Dialog>
	);
};

const ScheduleDeleteButton = ({
	id,
	repeat,
	scheduleDate,
}: {
	id: Selectable<Schedules>["id"];
	repeat: Selectable<Schedules>["repeat"];
	scheduleDate: Date;
}) => {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const [deleteType, setDeleteType] = useState<"only" | "all" | "afterward">(
		"all",
	);

	const { mutate } = useMutation(
		services.schedule.mutation.deleteSchedule({
			id,
			date: format(scheduleDate, "yyyy-MM-dd"),
		}),
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			mutate(repeat === "once" ? "all" : deleteType, {
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ["schedules"] });
				},
			});
			setOpen(false);
		},
		[mutate, repeat, deleteType, queryClient],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button variant="destructive-outline" size="icon" />}
			>
				<TrashIcon />
			</DialogTrigger>
			<DialogPopup>
				<form onSubmit={handleSubmit} className="contents">
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							You are about to delete this schedule.
						</DialogDescription>
					</DialogHeader>
					{repeat !== "once" && (
						<DialogPanel>
							<RadioGroup
								onValueChange={(v) =>
									setDeleteType(v as "only" | "all" | "afterward")
								}
								value={deleteType}
							>
								<Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
									<Radio id="only" value="only" />
									<div className="flex flex-col gap-1">
										<Label htmlFor="only">Only for this date</Label>
										<p className="text-xs text-muted-foreground">
											Delete this schedule only for the selected date
										</p>
									</div>
								</Label>
								<Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
									<Radio id="afterward" value="afterward" />
									<div className="flex flex-col gap-1">
										<Label htmlFor="afterward">This date and after</Label>
										<p className="text-xs text-muted-foreground">
											Delete this schedule for the selected date and after
										</p>
									</div>
								</Label>
								<Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
									<Radio id="all" value="all" />
									<div className="flex flex-col gap-1">
										<Label htmlFor="all">Every schedule</Label>
										<p className="text-xs text-muted-foreground">
											Delete this schedule entirely, including past and future
											schedule.
										</p>
									</div>
								</Label>
							</RadioGroup>
						</DialogPanel>
					)}
					<DialogFooter>
						<Button type="button" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="destructive">
							Delete
						</Button>
					</DialogFooter>
				</form>
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
