import { writeDB } from "../local-db";
import { hashStr } from "../local-db/cipher";
import MetaDataType from "../types/MetaDataType";
import TimetableDocType from "../types/TimetableDocType";
import { computeRoomTimetable, computeRooms, computeTeacherTimetable, computeTeachers } from "./computes";

class TimetableRepository {

  public static writeMetaData(metaData: MetaDataType) {
    writeDB("meta_data", metaData, false);
  }

  public static writeTimetables(timetables: TimetableDocType[]) {
    writeDB("all_timetables", timetables, false)
    writeDB("timetable_paths", timetables.map(t=> t.uid).map(hashStr), false)

    const timetableSnapShot = timetables.map((timetable)=> writeDB(timetable.uid, timetable))
    const newTimetableChanges = timetableSnapShot.filter(({ similarity })=> similarity === 'different')
    writeDB("timetable_new_changes", newTimetableChanges.map(({ content })=> hashStr(content.uid)), false);

    return this;
  }
  
  public static writeTeachersTimetable(timetables: TimetableDocType[]) {
    const teachers = computeTeachers(timetables);
    writeDB("teachers", teachers, false);
    writeDB("teacher_paths", teachers.map(hashStr), false)

    const teachersSnapShot = teachers.map((teacher) => writeDB(teacher, computeTeacherTimetable(teacher, timetables)));
    const teacherNewChanges = teachersSnapShot.filter(({ similarity }) => similarity === 'different')
    writeDB("teacher_new_changes", teacherNewChanges.map(({ content}) => hashStr(content.uid)), false)  

    return this;
  }
  
  public static writeRoomsTimetable(timetables: TimetableDocType[]) {
    const rooms = computeRooms(timetables);
    writeDB("rooms", rooms, false);
    writeDB("rooms_paths", rooms.map(hashStr), false)

    const roomsSnapShot = rooms.map((room) => writeDB(room, computeRoomTimetable(room, timetables)));
    const roomsNewChanges = roomsSnapShot.filter(({ similarity })=> similarity == 'different')
    writeDB("room_new_changes", roomsNewChanges.map(({ content })=> hashStr(content.uid)), false)

    return this;
  }
}

export default TimetableRepository;
